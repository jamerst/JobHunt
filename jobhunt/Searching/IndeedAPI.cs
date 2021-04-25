using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

using JobHunt.Configuration;
using JobHunt.DTO;

namespace JobHunt.Searching {
    public class IndeedAPI : ISearchProvider {
        private const string _url = "https://api.indeed.com/ads/apisearch";
        private readonly SearchOptions _options;
        public IndeedAPI(IOptions<SearchOptions> options) {
            _options = options.Value;
        }

        public async Task SearchAsync(SearchParameters searchParameters, HttpClient client) {
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

            IndeedResponse? results;

            using (var response = await client.GetAsync(QueryHelpers.AddQueryString(_url, query), HttpCompletionOption.ResponseHeadersRead)) {
                if (response.IsSuccessStatusCode) {
                    using (var stream = await response.Content.ReadAsStreamAsync()) {
                        results = await JsonSerializer.DeserializeAsync<IndeedResponse>(stream);
                    }
                }
            }
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