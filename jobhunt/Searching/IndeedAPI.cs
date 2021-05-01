using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using JobHunt.Configuration;
using JobHunt.Data;
using JobHunt.DTO;
using JobHunt.Models;
using JobHunt.Services;

namespace JobHunt.Searching {
    public class IndeedAPI : IIndeedAPI {
        private const string _apiUrl = "https://api.indeed.com/ads/apisearch";
        private const string _descUrl = "https://indeed.com/rpc/jobdescs";
        private readonly ICompanyService _companyService;
        private readonly IJobService _jobService;
        private readonly ISearchService _searchService;
        private readonly ILogger _logger;
        private readonly SearchOptions _options;
        private const int _pageSize = 25;
        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions() {
            PropertyNameCaseInsensitive = true,
            Converters = { new IndeedDateTimeConverter() }
        };
        public IndeedAPI( ICompanyService companyService, IJobService jobService, ISearchService searchService, IOptions<SearchOptions> options, ILogger<IndeedAPI> logger) {
            _companyService = companyService;
            _jobService = jobService;
            _searchService = searchService;
            _logger = logger;
            _options = options.Value;
        }

        public async Task SearchAllAsync(HttpClient client, CancellationToken token) {
            IEnumerable<Search> searches = await _searchService.FindByProviderAsync(SearchProviderName.Indeed);

            foreach(Search search in searches) {
                if (token.IsCancellationRequested) {
                    break;
                }

                await SearchAsync(search, client, token);
            }
        }

        public async Task SearchAsync(Search search, HttpClient client, CancellationToken token) {
            Stopwatch sw = new Stopwatch();
            sw.Start();
            Dictionary<string, string?> query = new Dictionary<string, string?>() {
                { "publisher", _options.IndeedPublisherId },
                { "q", search.Query },
                { "co", search.Country },
                { "sort", "date" },
                { "limit", _pageSize.ToString() },
                { "format", "json" },
                { "userip", "1.2.3.4" },
                { "useragent", "Mozilla//4.0(Firefox)" },
                { "latlong", "1" },
                { "v", "2" }
            };

            if (search.Location != null) {
                query.Add("l", search.Location);
            }

            if (search.Distance.HasValue) {
                query.Add("radius", search.Distance.Value.ToString());
            }

            if (search.MaxAge.HasValue) {
                query.Add("fromage", search.MaxAge.Value.ToString());
            }

            int start = 0;
            bool existingFound = false;

            List<Job> jobs = new List<Job>();
            List<Company> companies = new List<Company>();
            StringBuilder jobKeys = new StringBuilder();
            int newJobs = 0;

            while (!existingFound && !token.IsCancellationRequested) {
                IndeedResponse? response = null;

                query["start"] = start.ToString();
                using (var httpResponse = await client.GetAsync(QueryHelpers.AddQueryString(_apiUrl, query), HttpCompletionOption.ResponseHeadersRead)) {
                    if (httpResponse.IsSuccessStatusCode) {
                        using (var stream = await httpResponse.Content.ReadAsStreamAsync()) {
                            response = await JsonSerializer.DeserializeAsync<IndeedResponse>(stream, _jsonOptions);
                        }
                    } else {
                        sw.Stop();
                        _logger.LogError("Indeed API request failed", httpResponse);
                        await _searchService.UpdateFetchResultAsync(search.Id!, 0, false);
                        await _searchService.CreateSearchRunAsync(search.Id!, false, $"Indeed API error: HTTP {(int)httpResponse.StatusCode}", 0, 0, (int)sw.Elapsed.TotalSeconds);
                        return;
                    }
                }

                if (response == null || response.Results == null) {
                    sw.Stop();
                    await _searchService.UpdateFetchResultAsync(search.Id!, 0, false);
                    await _searchService.CreateSearchRunAsync(search.Id!, false, "Indeed API deserialisation error", 0, 0, (int)sw.Elapsed.TotalSeconds);
                    return;
                }

                foreach(IndeedJobResult job in response.Results) {
                    if (token.IsCancellationRequested) {
                        break;
                    }

                    if (!await _jobService.AnyWithSourceIdAsync(SearchProviderName.Indeed, job.JobKey)) {
                        jobKeys.Append(job.JobKey + ",");
                        newJobs++;

                        Company company = await _companyService.FindByNameAsync(job.Company);
                        if (company != null) {
                            jobs.Add(new Job {
                                Title = job.JobTitle,
                                Description = job.Snippet,
                                Location = job.FormattedLocation,
                                Url = job.Url,
                                CompanyId = company.Id,
                                Posted = job.Date,
                                Provider = SearchProviderName.Indeed,
                                ProviderId = job.JobKey,
                                SourceId = search.Id!,
                                Archived = company.Blacklisted
                            });
                        } else if (company == null && companies.Any(c => c.Name == job.Company)) {
                            Company newCompany = companies.First(c => c.Name == job.Company);
                            newCompany.Jobs.Add(new Job {
                                Title = job.JobTitle,
                                Description = job.Snippet,
                                Location = job.FormattedLocation,
                                Url = job.Url,
                                Posted = job.Date,
                                Provider = SearchProviderName.Indeed,
                                ProviderId = job.JobKey,
                                SourceId = search.Id!
                            });
                        } else {
                            companies.Add(new Company {
                                Name = job.Company,
                                Location = job.FormattedLocation,
                                Jobs = new List<Job> {
                                    new Job {
                                        Title = job.JobTitle,
                                        Description = job.Snippet,
                                        Location = job.FormattedLocation,
                                        Url = job.Url,
                                        Posted = job.Date,
                                        Provider = SearchProviderName.Indeed,
                                        ProviderId = job.JobKey,
                                        SourceId = search.Id!
                                    }
                                }
                            });
                        }                    
                    } else {
                        existingFound = true;
                    }
                }

                if (start + _pageSize < response.TotalResults) {
                    start += _pageSize;
                } else {
                    break;
                }
            }

            if (newJobs == 0) {
                sw.Stop();
                await _searchService.CreateSearchRunAsync(search.Id!, true, null, 0, 0, (int)sw.Elapsed.TotalSeconds);
                return;
            }

            // Indeed doesn't provide full job descriptions through their API, so use this undocumented endpoint to get them
            // You have no idea how difficult it was to find this endpoint
            Dictionary<string, string>? jobDescs = new Dictionary<string, string>();
            using (var httpResponse = await client.GetAsync($"{_descUrl}?jks={jobKeys}", HttpCompletionOption.ResponseHeadersRead)) {
                if (httpResponse.IsSuccessStatusCode) {
                    string temp = await httpResponse.Content.ReadAsStringAsync();
                    using (var stream = await httpResponse.Content.ReadAsStreamAsync()) {
                        jobDescs = await JsonSerializer.DeserializeAsync<Dictionary<string, string>>(stream);
                    }
                } else {
                    sw.Stop();
                    _logger.LogError("Indeed Job Descriptions request failed", httpResponse);
                    await _searchService.CreateSearchRunAsync(search.Id!, true, $"Job descriptions API error: HTTP {(int)httpResponse.StatusCode}", newJobs, companies.Count, (int)sw.Elapsed.TotalSeconds);

                }
            }

            if (jobDescs != null) {
                for (int i = 0; i < jobs.Count; i++) {
                    if (jobDescs.TryGetValue(jobs[i].ProviderId!, out string? desc)) {
                        jobs[i].Description = desc;
                    }
                }

                for (int i = 0; i < companies.Count; i++) {
                    for (int j = 0; j < companies[i].Jobs.Count; j++) {
                        if (jobDescs.TryGetValue(companies[i].Jobs[j].ProviderId!, out string? desc)) {
                            companies[i].Jobs[j].Description = desc;
                        }
                    }
                }
            } else {
                sw.Stop();
                await _searchService.CreateSearchRunAsync(search.Id!, true, "Job descriptions deserialisation error", newJobs, companies.Count, (int)sw.Elapsed.TotalSeconds);
            }

            await _jobService.CreateAllAsync(jobs);
            await _companyService.CreateAllAsync(companies);
            sw.Stop();
            await _searchService.CreateSearchRunAsync(search.Id!, true, null, newJobs, companies.Count, (int)sw.Elapsed.TotalSeconds);
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

        private class IndeedDateTimeConverter : JsonConverter<DateTime> {
            public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            {
                Debug.Assert(typeToConvert == typeof(DateTime));
                return DateTime.ParseExact(reader.GetString()!, "r", CultureInfo.InvariantCulture);
            }

            public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
            {
                writer.WriteStringValue(value.ToString());
            }
        }
    }

    public interface IIndeedAPI : ISearchProvider { };
}