using System.Diagnostics;
using Microsoft.EntityFrameworkCore;

using Pandoc;

namespace JobHunt.Searching.Indeed;
public class IndeedApiSearchProvider : IIndeedApiSearchProvider
{
    public const int PageSize = 25;

    private readonly IAlertService _alertService;
    private readonly ICategoryService _categoryService;
    private readonly ICompanyService _companyService;
    private readonly IJobService _jobService;
    private readonly ISearchService _searchService;

    private readonly IIndeedJobFetcher _fetcher;

    private readonly ILogger _logger;

    public IndeedApiSearchProvider(
        IAlertService alertService,
        ICategoryService categoryService,
        ICompanyService companyService,
        IJobService jobService,
        ISearchService searchService,

        IIndeedJobFetcher fetcher,

        ILogger<IndeedApiSearchProvider> logger
    )
    {
        _alertService = alertService;
        _categoryService = categoryService;
        _companyService = companyService;
        _jobService = jobService;
        _searchService = searchService;
        _fetcher = fetcher;
        _logger = logger;
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

        DateTime? maxAge = null;
        if (search.MaxAge.HasValue)
        {
            maxAge = DateTime.UtcNow.Date.AddDays(-1 * search.MaxAge.Value);
        }

        #region Fetch results
        int newJobs = 0;
        List<JobResult> jobResults = new List<JobResult>();
        async Task<bool> processResults(IEnumerable<JobResult> results)
        {
            bool getNextPage = true;

            foreach (var result in results)
            {
                if (token.IsCancellationRequested)
                {
                    break;
                }

                if (result.Posted < maxAge)
                {
                    getNextPage = false;
                }

                if (!await _jobService.AnyWithProviderIdAsync(SearchProviderName.Indeed, result.Key))
                {
                    newJobs++;

                    jobResults.Add(result);
                }
                else
                {
                    getNextPage = false;
                }
            }

            return getNextPage;
        }

        string? errorMessage = null;
        bool searchSuccess = await _fetcher.JobSearchAsync(search, processResults, token);
        if (!searchSuccess)
        {
            errorMessage = "Job search API error";
            await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", "Indeed job search API error");

            if (newJobs == 0)
            {
                sw.Stop();
                await _searchService.CreateSearchRunAsync(search.Id, false, null, 0, 0, (int) sw.Elapsed.TotalSeconds);
                return false;
            }
        }
        else if (newJobs == 0)
        {
            sw.Stop();
            await _searchService.CreateSearchRunAsync(search.Id, true, null, 0, 0, (int) sw.Elapsed.TotalSeconds);
            return true;
        }
        #endregion

        #region Fetch additional data
        bool afterSearchSuccess = await _fetcher.AfterSearchCompleteAsync(search, jobResults, token);
        if (!afterSearchSuccess)
        {
            errorMessage = "Job data API error";
            await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", "Indeed job data API error");
        }
        #endregion

        #region Construct entities
        Dictionary<string, int> categoryIdByName = (await _categoryService.Set.ToListAsync())
            .DistinctBy(c => c.Name.ToLower())
            .ToDictionary(c => c.Name, c => c.Id, StringComparer.OrdinalIgnoreCase);

        var engine = new PandocEngine("/usr/bin/pandoc");
        bool markdownSuccess = true;

        List<Job> jobs = new List<Job>();
        List<Job> alertJobs = new List<Job>();
        List<Company> companies = new List<Company>();
        foreach (var result in jobResults)
        {
            string markdown = "";
            if (!string.IsNullOrEmpty(result.HtmlDescription))
            {
                try
                {
                    var pandocResult = await engine.ConvertToText<HtmlIn, MdStrictOut>(result.HtmlDescription);
                    markdown = pandocResult.Value;
                }
                catch (Exception e)
                {
                    markdownSuccess = false;
                    errorMessage = "Markdown conversion error";
                    _logger.LogError(e, "Failed to convert Indeed job description for {JobKey} to markdown", result.Key);
                }
            }

            Job newJob = new Job
            {
                Title = result.Title,
                Description = markdown,
                Salary = result.FormattedSalary,
                AvgYearlySalary = result.AvgYearlySalary,
                Remote = result.Remote,
                Location = result.Location,
                Latitude = result.Latitude,
                Longitude = result.Longitude,
                Url = result.Url,
                Posted = result.Posted,
                Provider = SearchProviderName.Indeed,
                ProviderId = result.Key,
                SourceId = search.Id,
                JobCategories = result.Attributes
                    .Select(a => categoryIdByName.GetValueOrDefault(a))
                    .Where(id => id != default)
                    .Distinct()
                    .Select(id => new JobCategory { CategoryId = id })
                    .ToList()
            };

            Company? company = await _companyService.FindByNameAsync(result.EmployerName.ToLower());
            if (company == default && !string.IsNullOrEmpty(result.AlternativeEmployerName))
            {
                company = await _companyService.FindByNameAsync(result.AlternativeEmployerName.ToLower());
            }

            if (company != default)
            {
                // company already exists
                newJob.Company = company;
                newJob.Archived = company.Blacklisted;

                jobs.Add(newJob);

                if (company.Watched)
                {
                    alertJobs.Add(newJob);
                }

                if (company.Blacklisted && company.DeleteJobsAutomatically == true)
                {
                    newJob.Deleted = true;
                }
            }
            else
            {
                Company? newCompany = companies.FirstOrDefault(c => c.Name.ToLower() == result.EmployerName.ToLower());
                if (newCompany != default)
                {
                    // company doesn't exist, but has already been encountered
                    newCompany.Jobs.Add(newJob);
                }
                else
                {
                    // company doesn't exist
                    var createCompany = new Company
                    {
                        Name = result.EmployerName,
                        Jobs = new List<Job> { newJob }
                    };

                    if (!result.Remote)
                    {
                        createCompany.Location = result.Location;
                        createCompany.Latitude = result.Latitude;
                        createCompany.Longitude = result.Longitude;
                    }

                    if (!string.IsNullOrEmpty(result.AlternativeEmployerName))
                    {
                        createCompany.AlternateNames = new()
                        {
                            new CompanyName { Name = result.AlternativeEmployerName }
                        };
                    }

                    companies.Add(createCompany);

                }
            }
        }
        #endregion

        #region Create entities
        await _jobService.CreateAllAsync(jobs);
        await _companyService.CreateAllAsync(companies);

        sw.Stop();

        await _searchService.CreateSearchRunAsync(
            search.Id,
            searchSuccess && afterSearchSuccess && markdownSuccess,
            errorMessage,
            newJobs,
            companies.Count,
            (int)sw.Elapsed.TotalSeconds
        );

        foreach (var job in alertJobs)
        {
            await _alertService.CreateAsync(new Alert
            {
                Type = AlertType.NewJob,
                Title = $"New job posted by {job.Company.Name}",
                Message = $"'{job.Title}'",
                Url = $"/job/{job.Id}#jobs"
            });
        }
        #endregion

        return true;
    }

    public static readonly string[] SupportedCountries = { "ar", "au", "at", "bh", "be", "br", "ca", "cl", "cn", "co", "cz", "dk", "fi", "fr", "de", "gr", "hk", "hu", "in", "id", "ie", "il", "it", "jp", "kr", "kw", "lu", "my", "mx", "nl", "nz", "no", "om", "pk", "pe", "ph", "pl", "pt", "qt", "ro", "ru", "sa", "sg", "za", "es", "se", "ch", "tw", "th", "tr", "ae", "gb", "us", "ve", "vn" };
    public static readonly string[] JobTypes = { "permanent", "fulltime", "contract", "apprenticeship", "temporary", "parttime", "internship" };
}

public interface IIndeedApiSearchProvider : ISearchProvider { };