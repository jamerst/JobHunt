using System.Globalization;

using GraphQL.Client.Abstractions;
using GraphQL.Client.Http;
using GraphQL.Client.Serializer.SystemTextJson;

namespace JobHunt.Searching.Indeed;

public interface IIndeedGraphQLService
{
    Task<JobDataResponse?> GetJobDataAsync(IEnumerable<string> jobKeys, string country);
}

public class IndeedGraphQLService : IIndeedGraphQLService
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

    public async Task<JobDataResponse?> GetJobDataAsync(IEnumerable<string> jobKeys, string country)
    {
        var client = new GraphQLHttpClient(
            new GraphQLHttpClientOptions
            {
                EndPoint = new Uri($"https://apis.indeed.com/graphql?co={country}&locale={CultureInfo.CurrentCulture.Name}")
            },
            new SystemTextJsonSerializer(options =>
                options.PropertyNameCaseInsensitive = true
            ),
            _client
        );

        var request = new IndeedGraphQLHttpRequest
        {
            Query = """
                query Salary($jobKeys: [ID!]) {
                  jobData(jobKeys: $jobKeys) {
                    results {
                      job {
                        compensation {
                          baseSalary {
                            range {
                              ... on AtLeast {
                                __typename
                                min
                              }
                              ... on AtMost {
                                __typename
                                max
                              }
                              ... on Exactly {
                                __typename
                                value
                              }
                              ... on Range {
                                __typename
                                max
                                min
                              }
                            }
                            unitOfWork
                          }
                          estimated {
                            baseSalary {
                              range {
                                ... on AtLeast {
                                  __typename
                                  min
                                }
                                ... on AtMost {
                                  __typename
                                  max
                                }
                                ... on Exactly {
                                  __typename
                                  value
                                }
                                ... on Range {
                                  __typename
                                  max
                                  min
                                }
                              }
                              unitOfWork
                            }
                            formattedText
                          }
                          formattedText
                        }
                        key
                        description {
                          html
                        }
                        attributes {
                          label
                        }
                      }
                    }
                  }
                }
                """,
            Variables = new { jobKeys },
            ApiKey = _options.IndeedGraphQLApiKey
        };

        var response = await client.SendQueryAsync<JobDataResponse>(request);
        if (response != null && !(response.Errors?.Any() ?? false))
        {
            return response.Data;
        }
        else
        {
            _logger.LogError("Indeed GraphQL GetSalaryDataAsync error {errors}", new object?[] { response?.Errors });
        }

        return null;
    }

    private class IndeedGraphQLHttpRequest : GraphQLHttpRequest
    {
        public string ApiKey { get; set; } = null!;

        public override HttpRequestMessage ToHttpRequestMessage(GraphQLHttpClientOptions options, IGraphQLJsonSerializer serializer)
        {
            var request = base.ToHttpRequestMessage(options, serializer);
            request.Headers.Add("indeed-api-key", ApiKey);

            return request;
        }
    }
}