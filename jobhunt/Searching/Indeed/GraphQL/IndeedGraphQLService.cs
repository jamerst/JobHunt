using System.Globalization;

using GraphQL.Client.Abstractions;
using GraphQL.Client.Http;
using GraphQL.Client.Serializer.SystemTextJson;

namespace JobHunt.Searching.Indeed.GraphQL;

public interface IIndeedGraphQLService
{
    Task<JobDataResponse?> GetJobDataAsync(IEnumerable<string> jobKeys, string country);
}

public class IndeedGraphQLService : IIndeedGraphQLService, IIndeedJobFetcher
{
    private readonly HttpClient _client;
    private readonly SearchOptions _options;
    private readonly ILogger _logger;

    public IndeedGraphQLService(HttpClient client, IOptions<SearchOptions> options, ILogger<IndeedGraphQLService> logger)
    {
        _client = client;
        _options = options.Value;
        _logger = logger;
    }

    private const int SearchLimit = 50;
    public async Task<bool> JobSearchAsync(Search search, Func<IEnumerable<JobResult>, Task<bool>> processResults, CancellationToken token)
    {
        using var client = GetClient(search.Country.ToUpper());

        var variables = new JobSearchVariables
        {
            Cursor = null,
            Query = search.Query,
            Limit = SearchLimit
        };

        if (search.Location != null && search.Distance.HasValue)
        {
            variables.Location = new JobSearchLocationInput
            {
                Where = search.Location,
                Radius = search.Distance.Value,
                RadiusUnit = "MILES"
            };
        }

        var request = new IndeedGraphQLHttpRequest
        {
            Query = Queries.JobSearchQuery,
            Variables = variables,
            ApiKey = _options.IndeedGraphQLApiKey
        };

        do
        {
            var response = await client.SendQueryAsync<JobSearchResponse>(request);
            if (response != null && (response.Errors == null || !response.Errors.Any()))
            {
                var result = response.Data.Data.JobSearch;

                bool getNextPage = await processResults(result.Results.Select(r => r.ToJobResult()));

                if (getNextPage && !string.IsNullOrEmpty(result.PageInfo.NextCursor))
                {
                    variables.Cursor = result.PageInfo.NextCursor;
                }
                else
                {
                    break;
                }
            }
            else
            {
                _logger.LogError("Indeed GraphQL JobSearchAsync error {@response}", response);
                return false;
            }

        } while (!token.IsCancellationRequested);

        return true;
    }

    public Task AfterSearchCompleteAsync(IEnumerable<Job> jobs) => Task.CompletedTask;

    public async Task<JobDataResponse?> GetJobDataAsync(IEnumerable<string> jobKeys, string country)
    {
        using var client = GetClient(country);

        var request = new IndeedGraphQLHttpRequest
        {
            Query = Queries.JobDataQuery,
            Variables = new { jobKeys },
            ApiKey = _options.IndeedGraphQLApiKey
        };

        var response = await client.SendQueryAsync<JobDataResponse>(request);
        if (response != null && (response.Errors == null || !response.Errors.Any()))
        {
            return response.Data;
        }
        else
        {
            _logger.LogError("Indeed GraphQL GetJobDataAsync error {@response}", response);
        }

        return null;
    }

    private string GetGraphQLEndpointUrl(string country)
        => $"https://apis.indeed.com/graphql?co={country}&locale={CultureInfo.CurrentCulture.Name}";

    private GraphQLHttpClient GetClient(string country) =>
        new GraphQLHttpClient(
            new GraphQLHttpClientOptions
            {
                EndPoint = new Uri(GetGraphQLEndpointUrl(country))
            },
            new SystemTextJsonSerializer(options =>
                options.PropertyNameCaseInsensitive = true
            ),
            _client
        );

    private class IndeedGraphQLHttpRequest : GraphQLHttpRequest
    {
        public required string ApiKey { get; set; }

        public override HttpRequestMessage ToHttpRequestMessage(GraphQLHttpClientOptions options, IGraphQLJsonSerializer serializer)
        {
            var request = base.ToHttpRequestMessage(options, serializer);
            request.Headers.Add("indeed-api-key", ApiKey);

            return request;
        }
    }
}