using System.Diagnostics;

using Microsoft.EntityFrameworkCore;

using Refit;

using JobHunt.Converters;

namespace JobHunt.Searching.Indeed;
public class IndeedApiSearchProvider : IIndeedApiSearchProvider
{
    public const int PageSize = 25;

    private readonly IAlertService _alertService;
    private readonly ICategoryService _categoryService;
    private readonly ICompanyService _companyService;
    private readonly IJobService _jobService;
    private readonly ISearchService _searchService;

    private readonly IIndeedPublisherApi _publisherApi;
    private readonly IIndeedGraphQLService _graphQLService;
    private readonly IIndeedSalaryApiFactory _salaryApiFactory;
    private readonly IIndeedJobDescriptionApi _descApi;

    private readonly ILogger _logger;
    private readonly SearchOptions _options;

    public IndeedApiSearchProvider(
        IAlertService alertService,
        ICategoryService categoryService,
        ICompanyService companyService,
        IJobService jobService,
        ISearchService searchService,

        IIndeedPublisherApi publisherApi,
        IIndeedGraphQLService graphQLService,
        IIndeedSalaryApiFactory salaryApiFactory,
        IIndeedJobDescriptionApi descApi,

        IOptions<SearchOptions> options,
        ILogger<IndeedApiSearchProvider> logger
    )
    {
        _alertService = alertService;
        _categoryService = categoryService;
        _companyService = companyService;
        _jobService = jobService;
        _searchService = searchService;
        _publisherApi = publisherApi;
        _graphQLService = graphQLService;
        _salaryApiFactory = salaryApiFactory;
        _descApi = descApi;
        _logger = logger;
        _options = options.Value;
    }

    public async Task SearchAllAsync(CancellationToken token)
    {
        IEnumerable<Search> searches = await _searchService.FindEnabledByProviderAsync(SearchProviderName.Indeed);

        foreach (Search search in searches)
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            try
            {
                await SearchAsync(search, token);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Uncaught IndeedAPI exception for search {SearchId}", search.Id);
            }
        }
    }

    public async Task<bool> SearchAsync(Search search, CancellationToken token)
    {
        Stopwatch sw = new Stopwatch();
        sw.Start();
        var query = new JobSearchParams(_options.IndeedPublisherId, search);

        DateTime? maxAge = null;
        if (search.MaxAge.HasValue)
        {
            maxAge = DateTime.UtcNow.Date.AddDays(-1 * search.MaxAge.Value);
        }

        int start = 0;
        bool existingFound = false;

        List<Job> jobs = new List<Job>();
        List<Company> companies = new List<Company>();

        int newJobs = 0;

        List<JobAlertData> jobAlerts = new List<JobAlertData>();
        int salaryFailCount = 0;

        while (!existingFound && !token.IsCancellationRequested)
        {
            ApiResponse<JobSearchResponse> response;
            query.Start = start;
            try
            {
                response = await _publisherApi.SearchAsync(query);
            }
            catch (Exception ex)
            {
                sw.Stop();
                _logger.LogError(ex, "Indeed Publisher API request exception");
                await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", $"Indeed Publisher API error");
                await _searchService.CreateSearchRunAsync(search.Id!, false, $"Indeed Publisher API error", 0, 0, (int) sw.Elapsed.TotalSeconds);
                return false;
            }

            if (!response.IsSuccessStatusCode || response.Content == null)
            {
                sw.Stop();
                _logger.LogError("Indeed Publisher API request failed {@response}", response);
                await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", "Indeed Publisher API error");
                await _searchService.CreateSearchRunAsync(search.Id!, false, "Indeed Publisher API error", 0, 0, (int) sw.Elapsed.TotalSeconds);
                return false;
            }

            foreach (var job in response.Content.Results)
            {
                if (token.IsCancellationRequested)
                {
                    break;
                }

                if (job.Date < maxAge)
                {
                    existingFound = true;
                    _logger.LogInformation("Found job posted before {MaxAge}, {JobKey}", maxAge, job.JobKey);
                }

                if (!await _jobService.AnyWithProviderIdAsync(SearchProviderName.Indeed, job.JobKey))
                {
                    newJobs++;

                    // get the hostname of the job view URL to allow creating link without tracking to correct domain
                    // returns "https://uk.indeed.com" for a UK job
                    string jobBaseUri = new Uri(job.Url).GetLeftPart(UriPartial.Authority);

                    Job newJob = new Job
                    {
                        Title = job.JobTitle,
                        Description = job.Snippet,
                        Location = job.FormattedLocation,
                        Latitude = job.Latitude,
                        Longitude = job.Longitude,
                        Url = $"{jobBaseUri}/viewjob?jk={job.JobKey}",
                        Posted = new DateTimeOffset(job.Date, TimeSpan.Zero),
                        Provider = SearchProviderName.Indeed,
                        ProviderId = job.JobKey,
                        SourceId = search.Id
                    };

                    Company? company = await _companyService.FindByNameAsync(job.Company);
                    if (company != default)
                    {
                        // company already exists
                        if (company.Watched)
                        {
                            jobAlerts.Add(new JobAlertData
                            {
                                JobKey = job.JobKey,
                                CompanyName = company.Name
                            });
                        }

                        newJob.CompanyId = company.Id;
                        newJob.Archived = company.Blacklisted;

                        jobs.Add(newJob);
                    }
                    else if (companies.Any(c => c.Name == job.Company))
                    {
                        // company doesn't exist, but has already been encountered
                        Company newCompany = companies.First(c => c.Name == job.Company);
                        newCompany.Jobs.Add(newJob);
                    }
                    else
                    {
                        // company doesn't exist
                        companies.Add(new Company
                        {
                            Name = job.Company,
                            Location = job.FormattedLocation,
                            Latitude = job.Latitude,
                            Longitude = job.Longitude,
                            Jobs = new List<Job> { newJob }
                        });
                    }
                }
                else
                {
                    existingFound = true;
                }
            }

            if (start + PageSize < response.Content.TotalResults)
            {
                start += PageSize;
            }
            else
            {
                break;
            }
        }

        if (newJobs == 0)
        {
            sw.Stop();
            await _searchService.CreateSearchRunAsync(search.Id!, true, null, 0, 0, (int) sw.Elapsed.TotalSeconds);
            return true;
        }

        bool requestSuccess = true;
        string? errorMessage = null;

        var allJobs = jobs.Concat(companies.SelectMany(c => c.Jobs));

        // try to fetch both salary and description from Indeed GraphQL API if enabled
        // not sure how reliable this will be, it requires an API key but I don't know how often this is refreshed
        // or if it is possible to automatically obtain one
        if (_options.IndeedUseGraphQL)
        {
            JobDataResponse? jobDataResponse = null;
            try
            {
                jobDataResponse = await _graphQLService.GetJobDataAsync(allJobs.Select(j => j.ProviderId!), search.Country.ToUpper());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Indeed GraphQL API request exception");
                await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", "Indeed GraphQL API error");

                requestSuccess = false;
                errorMessage = "Indeed GraphQL API Error";
            }

            if (jobDataResponse != null && jobDataResponse.JobData.Results.Any())
            {
                Dictionary<string, int> categoryIdByName = (await _categoryService.Set.ToListAsync())
                    .DistinctBy(c => c.Name.ToLower())
                    .ToDictionary(c => c.Name, c => c.Id, StringComparer.OrdinalIgnoreCase);

                var resultsByKey = jobDataResponse.JobData.Results.ToDictionary(r => r.Job.Key, r => r.Job);

                foreach (var job in allJobs)
                {
                    if (resultsByKey.TryGetValue(job.ProviderId!, out var result))
                    {
                        job.Salary = result.Compensation?.FormattedText
                            ?? result.Compensation?.Estimated?.GetFormattedText();

                        job.AvgYearlySalary = result.Compensation?.BaseSalary?.GetAvgYearlySalary()
                            ?? result.Compensation?.Estimated?.BaseSalary.GetAvgYearlySalary();

                        string? description = result.Description?.Html;
                        if (!string.IsNullOrEmpty(description))
                        {
                            try
                            {
                                (bool success, string output) = await PandocConverter.ConvertAsync("html", "markdown_strict", description);
                                if (success)
                                {
                                    job.Description = output;
                                }
                                else
                                {
                                    _logger.LogError("Failed to convert Indeed job description for {JobKey} to markdown {Output}", job.ProviderId, output);
                                }
                            }
                            catch (Exception e)
                            {
                                _logger.LogError(e, "Failed to convert Indeed job description for {JobKey} to markdown", job.ProviderId);
                            }
                        }

                        if (result.Attributes.Any())
                        {
                            // automatically create categories based on Indeed attributes if a category with the same
                            // name already exists
                            job.JobCategories = result.Attributes
                                .Select(a => categoryIdByName.GetValueOrDefault(a.Label))
                                .Where(id => id != default)
                                .Select(id => new JobCategory { CategoryId = id })
                                .ToList();
                        }
                    }
                    else
                    {
                        _logger.LogWarning("No GraphQL result for Indeed job {jobkey}", job.ProviderId);
                    }
                }
            }
            else if (requestSuccess)
            {
                _logger.LogError("Indeed GraphQL API request failed {@response}", jobDataResponse);
                await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", "Indeed GraphQL API error");

                requestSuccess = false;
                errorMessage = "Indeed GraphQL API error";
            }
        }

        // fallback to old separate salary and job description APIs if GraphQL failed
        if (!_options.IndeedUseGraphQL || !requestSuccess)
        {
            if (_options.IndeedFetchSalary)
            {
                foreach (var domain in allJobs.GroupBy(j => new Uri(j.Url!).GetLeftPart(UriPartial.Authority)))
                {
                    if (token.IsCancellationRequested)
                    {
                        break;
                    }

                    var api = _salaryApiFactory.CreateApi(domain.Key);
                    foreach (var job in domain)
                    {
                        if (salaryFailCount >= 10 || token.IsCancellationRequested)
                        {
                            break;
                        }

                        ApiResponse<SalaryResponse> response;
                        try
                        {
                            response = await api.GetSalaryAsync(job.ProviderId!);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Indeed Salary API request exception");
                            await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", "Indeed Salary API error");
                            salaryFailCount++;
                            continue;
                        }

                        if (response.IsSuccessStatusCode && response.Content != null)
                        {
                            (string? salary, int? avgYearlySalary) = response.Content.GetSalary();
                            job.Salary = salary;
                            job.AvgYearlySalary = avgYearlySalary;

                            salaryFailCount = 0;
                        }
                        else
                        {
                            _logger.LogError("Indeed Salary API request failed {@response}", response);
                            await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", "Indeed Salary API error");
                            salaryFailCount++;
                        }
                    }
                }
            }

            // Indeed doesn't provide full job descriptions through their publisher API, so use an undocumented endpoint to get them
            // You have no idea how difficult it was to find this endpoint
            ApiResponse<Dictionary<string, string>>? descResponse = null;
            try
            {
                descResponse = await _descApi.GetJobDescriptionsAsync(allJobs.Select(j => j.ProviderId!));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Indeed Job Description API request exception");
                await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", $"Indeed Job Description API error");

                requestSuccess = false;
                errorMessage = "Indeed Job Description API error";
            }

            if (descResponse != null && descResponse.IsSuccessStatusCode && descResponse.Content != null && descResponse.Content.Keys.Any())
            {
                foreach (Job job in allJobs)
                {
                    if (descResponse.Content.TryGetValue(job.ProviderId!, out string? desc))
                    {
                        try
                        {
                            (bool success, string output) = await PandocConverter.ConvertAsync("html", "markdown_strict", desc);
                            if (success)
                            {
                                job.Description = output;
                            }
                            else
                            {
                                _logger.LogError("Failed to convert Indeed job description for {JobKey} to markdown {Output}", job.ProviderId, output);
                            }
                        }
                        catch (Exception e)
                        {
                            _logger.LogError(e, "Failed to convert Indeed job description for {JobKey} to markdown", job.ProviderId);
                        }
                    }
                }
            }
            else if (requestSuccess)
            {
                _logger.LogError("Indeed Job Description API request failed {@response}", descResponse);
                await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", "Indeed Job Descriptions API error");

                requestSuccess = false;
                errorMessage = "Indeed Job Description API error";
            }
        }


        await _jobService.CreateAllAsync(jobs);
        await _companyService.CreateAllAsync(companies);

        sw.Stop();

        await _searchService.CreateSearchRunAsync(search.Id!, requestSuccess, errorMessage, newJobs, companies.Count, (int) sw.Elapsed.TotalSeconds);

        foreach (JobAlertData jobAlert in jobAlerts)
        {
            Job? job = jobs.FirstOrDefault(j => j.ProviderId == jobAlert.JobKey);
            if (job != null)
            {
                await _alertService.CreateAsync(new Alert
                {
                    Type = AlertType.NewJob,
                    Title = $"New job posted by {jobAlert.CompanyName}",
                    Message = $"'{job.Title}'",
                    Url = $"/job/{job.Id}#jobs"
                });
            }
        }

        return true;
    }

    private class JobAlertData
    {
        public string JobKey { get; set; } = null!;
        public string CompanyName { get; set; } = null!;
    }

    public static readonly string[] SupportedCountries = { "ar", "au", "at", "bh", "be", "br", "ca", "cl", "cn", "co", "cz", "dk", "fi", "fr", "de", "gr", "hk", "hu", "in", "id", "ie", "il", "it", "jp", "kr", "kw", "lu", "my", "mx", "nl", "nz", "no", "om", "pk", "pe", "ph", "pl", "pt", "qt", "ro", "ru", "sa", "sg", "za", "es", "se", "ch", "tw", "th", "tr", "ae", "gb", "us", "ve", "vn" };
    public static readonly string[] JobTypes = { "permanent", "fulltime", "contract", "apprenticeship", "temporary", "parttime", "internship" };
}

public interface IIndeedApiSearchProvider : ISearchProvider { };