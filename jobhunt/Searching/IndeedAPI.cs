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
using System.Web;

using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using JobHunt.Configuration;
using JobHunt.Converters;
using JobHunt.Models;
using JobHunt.Services;

namespace JobHunt.Searching {
    public class IndeedAPI : IIndeedAPI {
        private const string _apiUrl = "https://api.indeed.com/ads/apisearch";
        private const string _descUrl = "https://indeed.com/rpc/jobdescs";
        private readonly IAlertService _alertService;
        private readonly ICompanyService _companyService;
        private readonly IJobService _jobService;
        private readonly ISearchService _searchService;
        private readonly HttpClient _client;
        private readonly ILogger _logger;
        private readonly SearchOptions _options;
        private const int _pageSize = 25;
        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions() {
            PropertyNameCaseInsensitive = true,
            Converters = { new IndeedDateTimeConverter() }
        };
        public IndeedAPI(
            IAlertService alertService,
            ICompanyService companyService,
            IJobService jobService,
            ISearchService searchService,
            HttpClient client,
            IOptions<SearchOptions> options,
            ILogger<IndeedAPI> logger
        ) {
            _alertService = alertService;
            _companyService = companyService;
            _jobService = jobService;
            _searchService = searchService;
            _client = client;
            _logger = logger;
            _options = options.Value;
        }

        public async Task SearchAllAsync(CancellationToken token) {
            IEnumerable<Search> searches = await _searchService.FindEnabledByProviderAsync(SearchProviderName.Indeed);

            foreach (Search search in searches) {
                if (token.IsCancellationRequested) {
                    break;
                }

                try {
                    await SearchAsync(search, token);
                } catch (Exception e) {
                    _logger.LogError(e, "Uncaught IndeedAPI exception");
                }
            }
        }

        public async Task SearchAsync(Search search, CancellationToken token) {
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
                { "v", "2" },
                { "filter", "0" }
            };

            if (search.Location != null) {
                query.Add("l", search.Location);
            }

            if (search.Distance.HasValue) {
                query.Add("radius", search.Distance.Value.ToString());
            }

            DateTime maxAge = DateTime.MinValue;
            if (search.MaxAge.HasValue) {
                query.Add("fromage", search.MaxAge.Value.ToString());
                maxAge = DateTime.Now.Date.AddDays(-1 * search.MaxAge.Value);
            }

            if (search.EmployerOnly) {
                query.Add("sr", "directhire");
            }

            if (!string.IsNullOrEmpty(search.JobType)) {
                query.Add("jt", search.JobType);
            }


            int start = 0;
            bool existingFound = false;

            List<Job> jobs = new List<Job>();
            List<Company> companies = new List<Company>();
            StringBuilder jobKeys = new StringBuilder();
            int newJobs = 0;

            List<JobAlertData> jobAlerts = new List<JobAlertData>();
            int salaryFailCount = 0;

            while (!existingFound && !token.IsCancellationRequested) {
                IndeedResponse? response = null;

                query["start"] = start.ToString();
                try {
                    using (var httpResponse = await _client.GetAsync(QueryHelpers.AddQueryString(_apiUrl, query), HttpCompletionOption.ResponseHeadersRead)) {
                        if (httpResponse.IsSuccessStatusCode) {
                            using (var stream = await httpResponse.Content.ReadAsStreamAsync()) {
                                response = await JsonSerializer.DeserializeAsync<IndeedResponse>(stream, _jsonOptions);
                            }
                        } else {
                            sw.Stop();
                            _logger.LogError("Indeed API request failed", httpResponse);
                            await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", $"Indeed API error: HTTP {(int)httpResponse.StatusCode}");
                            await _searchService.CreateSearchRunAsync(search.Id!, false, $"Indeed API error: HTTP {(int) httpResponse.StatusCode}", 0, 0, (int) sw.Elapsed.TotalSeconds);
                            return;
                        }
                    }
                } catch (HttpRequestException ex) {
                    _logger.LogError(ex, "Indeed API request exception");
                }

                if (response == null || response.Results == null) {
                    sw.Stop();
                    await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", "Indeed API deserialisation error");
                    await _searchService.CreateSearchRunAsync(search.Id!, false, "Indeed API deserialisation error", 0, 0, (int) sw.Elapsed.TotalSeconds);
                    return;
                }

                foreach (IndeedJobResult job in response.Results) {
                    if (token.IsCancellationRequested) {
                        break;
                    }

                    if (job.Date < maxAge) {
                        existingFound = true;
                        _logger.LogInformation($"Found job older than MaxAge={maxAge:s}, JobKey={job.JobKey}");
                    }

                    if (!await _jobService.AnyWithSourceIdAsync(SearchProviderName.Indeed, job.JobKey)) {
                        jobKeys.Append(job.JobKey + ",");
                        newJobs++;

                        // Get the hostname of the job view URL to allow salary to be fetched in local currency
                        Uri jobUri = new Uri(job.Url);

                        string? salary = null;
                        int? avgYearlySalary = null;
                        if (_options.IndeedFetchSalary && salaryFailCount <= 10) {
                            Dictionary<string, string?> salaryQuery = new Dictionary<string, string?> {
                                { "jk", job.JobKey },
                                { "vjs", "1" }
                            };

                            IndeedSalaryResponse? salaryResponse = null;
                            using (var httpResponse = await _client.GetAsync(QueryHelpers.AddQueryString($"https://{jobUri.Host}/viewjob", salaryQuery), HttpCompletionOption.ResponseHeadersRead)) {
                                if (httpResponse.IsSuccessStatusCode) {
                                    using (var stream = await httpResponse.Content.ReadAsStreamAsync()) {
                                        try {
                                            salaryResponse = await JsonSerializer.DeserializeAsync<IndeedSalaryResponse>(stream, _jsonOptions);
                                        } catch (JsonException) {
                                            _logger.LogError("Indeed Salary deserialisation failed - likely requires a captcha");
                                            salaryFailCount++;
                                        }
                                    }
                                } else {
                                    await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", $"Indeed Salary API error: HTTP {(int)httpResponse.StatusCode}");
                                    _logger.LogError("Indeed Salary API request failed", httpResponse);
                                }
                            }

                            if (salaryResponse != null && salaryResponse.ExpectedSalary != null) {
                                salary = salaryResponse.FormattedSalary;
                                avgYearlySalary = salaryResponse.ExpectedSalary.GetYearlyAverage();
                                salaryFailCount = 0;
                            }
                        }

                        Company company = await _companyService.FindByNameAsync(job.Company);
                        if (company != null) { // company already exists
                            if (company.Watched) {
                                jobAlerts.Add(new JobAlertData {
                                    JobKey = job.JobKey,
                                    CompanyName = company.Name
                                });
                            }

                            jobs.Add(new Job {
                                Title = job.JobTitle,
                                Description = job.Snippet,
                                Salary = salary,
                                AvgYearlySalary = avgYearlySalary,
                                Location = job.FormattedLocation,
                                Latitude = job.Latitude,
                                Longitude = job.Longitude,
                                Url = $"https://{jobUri.Host}/viewjob?jk={job.JobKey}",
                                CompanyId = company.Id,
                                Posted = job.Date,
                                Provider = SearchProviderName.Indeed,
                                ProviderId = job.JobKey,
                                SourceId = search.Id!,
                                Archived = company.Blacklisted
                            });
                        } else if (company == null && companies.Any(c => c.Name == job.Company)) { // company doesn't exist, but has already been encountered
                            Company newCompany = companies.First(c => c.Name == job.Company);
                            newCompany.Jobs.Add(new Job {
                                Title = job.JobTitle,
                                Description = job.Snippet,
                                Salary = salary,
                                AvgYearlySalary = avgYearlySalary,
                                Location = job.FormattedLocation,
                                Latitude = job.Latitude,
                                Longitude = job.Longitude,
                                Url = $"https://{jobUri.Host}/viewjob?jk={job.JobKey}",
                                Posted = job.Date,
                                Provider = SearchProviderName.Indeed,
                                ProviderId = job.JobKey,
                                SourceId = search.Id!
                            });
                        } else {
                            companies.Add(new Company { // company doesn't exist
                                Name = job.Company,
                                Location = job.FormattedLocation,
                                Latitude = job.Latitude,
                                Longitude = job.Longitude,
                                Jobs = new List<Job> {
                                    new Job {
                                        Title = job.JobTitle,
                                        Description = job.Snippet,
                                        Salary = salary,
                                        AvgYearlySalary = avgYearlySalary,
                                        Location = job.FormattedLocation,
                                        Latitude = job.Latitude,
                                        Longitude = job.Longitude,
                                        Url = $"https://{jobUri.Host}/viewjob?jk={job.JobKey}",
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
                await _searchService.CreateSearchRunAsync(search.Id!, true, null, 0, 0, (int) sw.Elapsed.TotalSeconds);
                return;
            }

            // Indeed doesn't provide full job descriptions through their API, so use this undocumented endpoint to get them
            // You have no idea how difficult it was to find this endpoint
            Dictionary<string, string>? jobDescs = new Dictionary<string, string>();
            try {
                using (var httpResponse = await _client.GetAsync($"{_descUrl}?jks={jobKeys}", HttpCompletionOption.ResponseHeadersRead)) {
                    if (httpResponse.IsSuccessStatusCode) {
                        string temp = await httpResponse.Content.ReadAsStringAsync();
                        using (var stream = await httpResponse.Content.ReadAsStreamAsync()) {
                            jobDescs = await JsonSerializer.DeserializeAsync<Dictionary<string, string>>(stream);
                        }
                    } else {
                        sw.Stop();
                        _logger.LogError("Indeed Job Descriptions request failed", httpResponse);
                        await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", $"Indeed Job Descriptions API error: HTTP {(int)httpResponse.StatusCode}");
                        await _searchService.CreateSearchRunAsync(search.Id!, true, $"Job descriptions API error: HTTP {(int) httpResponse.StatusCode}", newJobs, companies.Count, (int) sw.Elapsed.TotalSeconds);
                    }
                }
            } catch (HttpRequestException ex) {
                _logger.LogError("Indeed Job Descriptions request failed", ex);
            }

            if (jobDescs != null && jobDescs.Keys.Count > 0) {
                for (int i = 0; i < jobs.Count; i++) {
                    if (jobDescs.TryGetValue(jobs[i].ProviderId!, out string? desc)) {
                        try {
                            (bool success, string output) = await PandocConverter.Convert("html", "markdown_strict", desc);
                            if (success) {
                                jobs[i].Description = output;
                            } else {
                                _logger.LogError($"Failed to convert Indeed job description to markdown (JobKey={jobs[i].ProviderId}) - {output}");
                            }
                        } catch (Exception e) {
                            _logger.LogError($"Failed to convert Indeed job description to markdown (JobKey={jobs[i].ProviderId}) - {e}");
                        }
                    }
                }

                for (int i = 0; i < companies.Count; i++) {
                    for (int j = 0; j < companies[i].Jobs.Count; j++) {
                        if (jobDescs.TryGetValue(companies[i].Jobs[j].ProviderId!, out string? desc)) {
                            try {
                                (bool success, string output) = await PandocConverter.Convert("html", "markdown_strict", desc);
                                if (success) {
                                    companies[i].Jobs[j].Description = output;
                                } else {
                                    _logger.LogError($"Failed to convert Indeed job description to markdown (JobKey={companies[i].Jobs[j].ProviderId}) - {output}");
                                }
                            } catch (Exception e) {
                                _logger.LogError($"Failed to convert Indeed job description to markdown (JobKey={companies[i].Jobs[j].ProviderId}) - {e}");
                            }
                        }
                    }
                }
            } else {
                sw.Stop();
                await _alertService.CreateErrorAsync($"Search Error ({search.ToString()})", "Indeed job descriptions deserialisation error");
                await _searchService.CreateSearchRunAsync(search.Id!, true, "Indeed job descriptions deserialisation error", newJobs, companies.Count, (int) sw.Elapsed.TotalSeconds);
            }

            await _jobService.CreateAllAsync(jobs);
            await _companyService.CreateAllAsync(companies);
            sw.Stop();
            await _searchService.CreateSearchRunAsync(search.Id!, true, null, newJobs, companies.Count, (int) sw.Elapsed.TotalSeconds);

            foreach (JobAlertData jobAlert in jobAlerts) {
                Job? job = jobs.FirstOrDefault(j => j.ProviderId == jobAlert.JobKey);
                if (job != null) {
                    await _alertService.CreateAsync(new Alert {
                        Type = AlertType.NewJob,
                        Title = $"New job posted by {jobAlert.CompanyName}",
                        Message = $"'{job.Title}'",
                        Url = $"/job/{job.Id}"
                    });
                }
            }
        }

        private class JobAlertData {
            public string JobKey { get; set; } = null!;
            public string CompanyName { get; set; } = null!;
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

        private class IndeedSalaryResponse {
            [JsonPropertyName("sEx")]
            public IndeedSalary? ExpectedSalary { get; set; }
            [JsonPropertyName("ssT")]
            public string? FormattedSalary { get; set; }
        }

        private class IndeedSalary {
            [JsonPropertyName("sAvg")]
            public double Average { get; set; }
            [JsonPropertyName("sRg")]
            public string? Range { get; set; }
            [JsonPropertyName("sT")]
            public string? Type { get; set; }
            public int? GetYearlyAverage() {
                switch (Type) {
                    case IndeedSalaryTypes.Yearly:
                        return (int) Average;
                    case IndeedSalaryTypes.Monthly:
                        return (int) (Average * 12);
                    case IndeedSalaryTypes.Weekly:
                        return (int) (Average * 48);
                    case IndeedSalaryTypes.Daily:
                        return (int) (Average * 48 * 5);
                    case IndeedSalaryTypes.Hourly:
                        return (int) (Average * 48 * 5 * 8);
                    case null:
                    default:
                        return null;
                }
            }
        }

        private class IndeedSalaryTypes {
            public const string Yearly = "YEARLY";
            public const string Monthly = "MONTHLY";
            public const string Weekly = "WEEKLY";
            public const string Daily = "DAILY";
            public const string Hourly = "HOURLY";

        }
        private class IndeedDateTimeConverter : JsonConverter<DateTime> {
            public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) {
                Debug.Assert(typeToConvert == typeof(DateTime));
                return DateTime.ParseExact(reader.GetString()!, "r", CultureInfo.InvariantCulture);
            }

            public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options) {
                writer.WriteStringValue(value.ToString());
            }
        }

        public static readonly string[] SupportedCountries = { "ar", "au", "at", "bh", "be", "br", "ca", "cl", "cn", "co", "cz", "dk", "fi", "fr", "de", "gr", "hk", "hu", "in", "id", "ie", "il", "it", "jp", "kr", "kw", "lu", "my", "mx", "nl", "nz", "no", "om", "pk", "pe", "ph", "pl", "pt", "qt", "ro", "ru", "sa", "sg", "za", "es", "se", "ch", "tw", "th", "tr", "ae", "gb", "us", "ve", "vn" };
        public static readonly string[] JobTypes = { "permanent", "fulltime", "contract", "apprenticeship", "temporary", "parttime", "internship" };
    }

    public interface IIndeedAPI : ISearchProvider { };
}