using System.Diagnostics;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

using Microsoft.AspNetCore.WebUtilities;

using Refit;

using JobHunt.Converters;

namespace JobHunt.Searching.Indeed;
public class IndeedApiSearchProvider : IIndeedApiSearchProvider
{
    public const int PageSize = 25;

    private readonly IAlertService _alertService;
    private readonly ICompanyService _companyService;
    private readonly IJobService _jobService;
    private readonly ISearchService _searchService;
    private readonly IIndeedPublisherApi _publisherApi;
    private readonly IIndeedSalaryApiFactory _salaryApiFactory;
    private readonly IIndeedJobDescriptionApi _descApi;
    private readonly ILogger _logger;
    private readonly SearchOptions _options;

    public IndeedApiSearchProvider(
        IAlertService alertService,
        ICompanyService companyService,
        IJobService jobService,
        ISearchService searchService,
        IIndeedPublisherApi publisherApi,
        IIndeedSalaryApiFactory salaryApiFactory,
        IIndeedJobDescriptionApi descApi,
        IOptions<SearchOptions> options,
        ILogger<IndeedApiSearchProvider> logger
    )
    {
        _alertService = alertService;
        _companyService = companyService;
        _jobService = jobService;
        _searchService = searchService;
        _publisherApi = publisherApi;
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

    public async Task SearchAsync(Search search, CancellationToken token)
    {
        Stopwatch sw = new Stopwatch();
        sw.Start();
        var query = new JobSearchParams(_options.IndeedPublisherId, search);

        DateTime maxAge = DateTime.MinValue;
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
            JobSearchResponse? response = null;

            query.Start = start;
            try
            {
                response = await _publisherApi.SearchAsync(query);
            }
            catch (ApiException ex)
            {
                _logger.LogError(ex, "Indeed Publisher API request exception");
                await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", $"Indeed Publisher API error");
                await _searchService.CreateSearchRunAsync(search.Id!, false, $"Indeed Publisher API error", 0, 0, (int) sw.Elapsed.TotalSeconds);
                return;
            }

            if (response?.Results == null)
            {
                sw.Stop();
                _logger.LogError("Indeed Publisher API request deserialisation failed");
                await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", "Indeed Publisher API error");
                await _searchService.CreateSearchRunAsync(search.Id!, false, "Indeed Publisher API error", 0, 0, (int) sw.Elapsed.TotalSeconds);
                return;
            }

            foreach (var job in response.Results)
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

                    // get the hostname of the job view URL to allow salary to be fetched in local currency
                    // returns "https://uk.indeed.com" for a UK job
                    string jobBaseUri = new Uri(job.Url).GetLeftPart(UriPartial.Authority);

                    string? salary = null;
                    int? avgYearlySalary = null;
                    if (_options.IndeedFetchSalary && salaryFailCount <= 10)
                    {
                        var api = _salaryApiFactory.CreateApi(jobBaseUri);
                        SalaryResponse? salaryResponse = null;
                        try
                        {
                            salaryResponse = await api.GetSalaryAsync(job.JobKey);
                        }
                        catch (ApiException ex)
                        {
                            _logger.LogError(ex, "Indeed Salary API request exception");
                            await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", "Indeed Salary API error");
                            salaryFailCount++;
                        }

                        if (salaryResponse != null)
                        {
                            (salary, avgYearlySalary) = salaryResponse.GetSalary();

                            salaryFailCount = 0;
                        }
                        else
                        {
                            _logger.LogError("Indeed Salary API deserialisation failed");
                            await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", "Indeed Salary API error");
                            salaryFailCount++;
                        }
                    }

                    Job newJob = new Job
                    {
                        Title = job.JobTitle,
                        Description = job.Snippet,
                        Salary = salary,
                        AvgYearlySalary = avgYearlySalary,
                        Location = job.FormattedLocation,
                        Latitude = job.Latitude,
                        Longitude = job.Longitude,
                        Url = $"{jobBaseUri}/viewjob?jk={job.JobKey}",
                        Posted = job.Date,
                        Provider = SearchProviderName.Indeed,
                        ProviderId = job.JobKey,
                        SourceId = search.Id!
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

            if (start + PageSize < response.TotalResults)
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
            return;
        }

        bool descSuccess = true;
        string? descMessage = null;

        var allJobs = jobs.Concat(companies.SelectMany(c => c.Jobs));

        // Indeed doesn't provide full job descriptions through their official API, so use an undocumented endpoint to get them
        // You have no idea how difficult it was to find this endpoint
        Dictionary<string, string>? jobDescs = null;
        try
        {
            jobDescs = await _descApi.GetJobDescriptionsAsync(allJobs.Select(j => j.ProviderId!));
        }
        catch (ApiException ex)
        {
            _logger.LogError(ex, "Indeed Job Description API request exception");
            await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", $"Indeed Job Description API error");

            descSuccess = false;
            descMessage = "Indeed Job Description API error";
        }

        if (jobDescs != null && jobDescs.Keys.Count > 0)
        {
            foreach (Job job in allJobs)
            {
                if (jobDescs.TryGetValue(job.ProviderId!, out string? desc))
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
        else if (descSuccess)
        {
            _logger.LogError("Indeed Job Description API request deserialisation failed");
            await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", "Indeed Job Descriptions API error");

            descSuccess = false;
            descMessage = "Indeed Job Description API error";
        }

        await _jobService.CreateAllAsync(jobs);
        await _companyService.CreateAllAsync(companies);

        // check for duplicates after saving in DB so that any duplicates within the new jobs are detected
        if (_options.CheckForDuplicateJobs)
        {
            foreach (var job in allJobs)
            {
                Job? duplicate = await _jobService.FindDuplicateAsync(job);

                if (duplicate != default)
                {
                    job.DuplicateJobId = duplicate.Id;
                    job.ActualCompanyId = duplicate.ActualCompanyId;

                    job.JobCategories.AddRange(
                        duplicate.JobCategories
                            .Select(c => new JobCategory { CategoryId = c.CategoryId })
                    );
                }
            }

            await _jobService.SaveChangesAsync();
        }

        sw.Stop();

        await _searchService.CreateSearchRunAsync(search.Id!, descSuccess, descMessage, newJobs, companies.Count, (int) sw.Elapsed.TotalSeconds);

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