using Refit;

using JobHunt.Searching.Indeed.GraphQL;

namespace JobHunt.Searching.Indeed.Publisher;

public class IndeedPublisherService : IIndeedJobFetcher
{
    private readonly IIndeedPublisherApi _api;
    private readonly IIndeedGraphQLService _graphQLService;
    private readonly IIndeedSalaryApiFactory _salaryApiFactory;
    private readonly IIndeedJobDescriptionApi _descApi;

    private readonly SearchOptions _options;
    private readonly ILogger _logger;
    public IndeedPublisherService(
        IIndeedPublisherApi api,
        IIndeedGraphQLService graphQLService,
        IIndeedSalaryApiFactory salaryApiFactory,
        IIndeedJobDescriptionApi descApi,
        IOptions<SearchOptions> options,
        ILogger<IndeedPublisherService> logger
    )
    {
        _api = api;
        _graphQLService = graphQLService;
        _salaryApiFactory = salaryApiFactory;
        _descApi = descApi;

        _options = options.Value;
        _logger = logger;
    }

    public const int PageSize = 25;
    public async Task<bool> JobSearchAsync(Search search, Func<IEnumerable<Indeed.JobResult>, Task<bool>> processResults, CancellationToken token)
    {
        var query = new JobSearchParams(_options.Indeed.PublisherId!, search);
        int start = 0;

        do
        {
            ApiResponse<JobSearchResponse> response;
            query.Start = start;
            try
            {
                response = await _api.SearchAsync(query);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Indeed Publisher API request exception");
                return false;
            }

            if (!response.IsSuccessStatusCode || response.Content == null)
            {
                _logger.LogError("Indeed Publisher API request failed {@response}", new { response.Content, response.StatusCode });
                return false;
            }

            bool getNextPage = await processResults(response.Content.Results.Select(r => r.ToJobResult()));

            if (getNextPage && start + PageSize < response.Content.TotalResults)
            {
                start += PageSize;
            }
            else
            {
                break;
            }

        } while (!token.IsCancellationRequested);

        return true;
    }

    public async Task<bool> AfterSearchCompleteAsync(Search search, IEnumerable<JobResult> jobs, CancellationToken token)
    {
        bool requestSucceeded = true;

        if (_options.Indeed.UseGraphQLSalaryAndDescriptions)
        {
            JobDataResponse? jobDataResponse = null;
            try
            {
                jobDataResponse = await _graphQLService.GetJobDataAsync(jobs.Select(j => j.Key), search.Country.ToUpper());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Indeed GraphQL API request exception");
                requestSucceeded = false;
            }

            if (jobDataResponse != null && jobDataResponse.JobData.Results.Any())
            {
                var resultsByKey = jobDataResponse.JobData.Results.ToDictionary(r => r.Job.Key, r => r.Job);

                foreach (var job in jobs)
                {
                    if (resultsByKey.TryGetValue(job.Key, out var result))
                    {
                        job.FormattedSalary = result.Compensation?.GetFormattedText();
                        job.AvgYearlySalary = result.Compensation?.GetAvgYearlySalary();

                        string? description = result.Description?.Html;
                        if (!string.IsNullOrEmpty(description))
                        {
                            job.HtmlDescription = description;
                        }

                        if (result.Attributes.Any())
                        {
                            job.Attributes = result.Attributes.Select(a => a.Label);
                        }
                    }
                    else
                    {
                        _logger.LogWarning("No GraphQL result for Indeed job {jobkey}", job.Key);
                    }
                }
            }
            else if (requestSucceeded)
            {
                _logger.LogError("Indeed GraphQL API request failed {@response}", jobDataResponse);
            }
        }

        // fallback to old separate salary and job description APIs if GraphQL failed
        if (!_options.Indeed.UseGraphQLSalaryAndDescriptions || !requestSucceeded)
        {
            int salaryFailCount = 0;

            if (_options.Indeed.FetchSalary)
            {
                foreach (var domain in jobs.GroupBy(j => new Uri(j.Url!).GetLeftPart(UriPartial.Authority)))
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
                            response = await api.GetSalaryAsync(job.Key);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Indeed Salary API request exception");
                            salaryFailCount++;
                            continue;
                        }

                        if (response.IsSuccessStatusCode && response.Content != null)
                        {
                            (string? salary, int? avgYearlySalary) = response.Content.GetSalary();
                            job.FormattedSalary = salary;
                            job.AvgYearlySalary = avgYearlySalary;

                            salaryFailCount = 0;
                        }
                        else
                        {
                            _logger.LogError("Indeed Salary API request failed {@response}", response);
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
                descResponse = await _descApi.GetJobDescriptionsAsync(jobs.Select(j => j.Key));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Indeed Job Description API request exception");

                requestSucceeded = false;
            }

            if (descResponse != null && descResponse.IsSuccessStatusCode && descResponse.Content != null && descResponse.Content.Keys.Any())
            {
                foreach (var job in jobs)
                {
                    if (descResponse.Content.TryGetValue(job.Key, out string? desc) && !string.IsNullOrEmpty(desc))
                    {
                        job.HtmlDescription = desc;
                    }
                }
            }
            else if (requestSucceeded)
            {
                _logger.LogError("Indeed Job Description API request failed {@response}", descResponse);
                requestSucceeded = false;
            }
        }

        return requestSucceeded;
    }
}