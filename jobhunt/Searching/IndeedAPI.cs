using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using JobHunt.Configuration;
using JobHunt.Data;
using JobHunt.DTO;
using JobHunt.Services;

namespace JobHunt.Searching {
    public class IndeedAPI : ISearchProvider {
        private const string _url = "https://api.indeed.com/ads/apisearch";
        private readonly IJobService _jobService;
        private readonly ISearchService _searchService;
        private readonly ILogger _logger;
        private readonly SearchOptions _options;
        public IndeedAPI(IJobService jobService, ISearchService searchService, IOptions<SearchOptions> options, ILogger<IndeedAPI> logger) {
            _jobService = jobService;
            _searchService = searchService;
            _logger = logger;
            _options = options.Value;
        }

        public async Task<SearchResults> SearchAsync(SearchParameters searchParameters, HttpClient client) {
            Dictionary<string, string?> query = new Dictionary<string, string?>() {
                { "publisher", _options.IndeedPublisherId },
                { "q", searchParameters.Query },
                { "co", searchParameters.Country },
                { "sort", "date" },
                { "limit", "25" },
                { "format", "json" },
                { "userip", "1.2.3.4" },
                { "useragent", "Mozilla//4.0(Firefox)" },
                { "latlong", "1" }
            };

            if (searchParameters.Location != null) {
                query.Add("l", searchParameters.Location);
            }

            if (searchParameters.Distance.HasValue) {
                query.Add("radius", searchParameters.Distance.Value.ToString());
            }

            if (searchParameters.MaxAge.HasValue) {
                query.Add("fromage", searchParameters.MaxAge.Value.ToString());
            }

            SearchResults results = new SearchResults(searchParameters.SearchId!);

            IndeedResponse? response;

            using (var httpResponse = await client.GetAsync(QueryHelpers.AddQueryString(_url, query), HttpCompletionOption.ResponseHeadersRead)) {
                if (httpResponse.IsSuccessStatusCode) {
                    using (var stream = await httpResponse.Content.ReadAsStreamAsync()) {
                        response = await JsonSerializer.DeserializeAsync<IndeedResponse>(stream);
                    }
                } else {
                    _logger.LogError("Indeed API request failed", httpResponse);
                    await _searchService.UpdateFetchResultAsync(searchParameters.SearchId!, 0, false);
                    results.Success = false;
                    return results;
                }
            }

            if (response == null) {
                await _searchService.UpdateFetchResultAsync(searchParameters.SearchId!, 0, false);
                results.Success = false;
                return results;
            }

            bool existingFound = false;
            foreach(IndeedJobResult job in response.Results) {
                if (!await _jobService.AnyWithSourceIdAsync(SearchProviderName.Indeed, job.JobKey)) {
                    results.Jobs.Add(new Job {
                        Title = job.JobTitle,
                        Description = job.Snippet,
                        Location = job.FormattedLocation,
                        Url = job.Url,
                        // CompanyId = company.Id,
                        Posted = job.Date,
                        Provider = SearchProviderName.Indeed,
                        ProviderId = job.JobKey,
                        SourceId = searchParameters.SearchId
                    });
                } else {
                    existingFound = true;
                }
            }

            return results;
        }

        private class IndeedResponse {
            public int TotalResults { get; set; }
            public IndeedJobResult[] Results { get; set; } = null!;
        }

        private class IndeedJobResult {
            public string JobTitle { get; set; } = null!;
            public string Company { get; set; } = null!;
            public string FormattedLocation { get; set; } = null!;
            public DateTime Date { get; set; }
            public string Snippet { get; set; } = null!;
            public string Url { get; set; } = null!;
            public double Latitude { get; set; }
            public double Longitude { get; set; }
            public string JobKey { get; set; } = null!;
            public bool Sponsored { get; set; }
        }
    }
}