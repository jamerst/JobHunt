using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Cronos;

using JobHunt.Configuration;
using JobHunt.Searching;
using JobHunt.Services;

namespace JobHunt.Workers {
    public class SearchRefreshWorker : IHostedService {
        private readonly IServiceProvider _provider;
        private readonly SearchOptions _options;
        private readonly ILogger _logger;
        
        public SearchRefreshWorker(IServiceProvider provider, IOptions<SearchOptions> options, ILogger<SearchRefreshWorker> logger) {
            _provider = provider;
            _options = options.Value;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken token) {
            _logger.LogInformation($"SearchRefreshWorker started ({DateTime.Now:s})");
            if (_options.Schedules == null) {
                _logger.LogError("No search refresh schedule provided. Stopping.");
                return;
            }
            CronExpression[] expressions = _options.Schedules.Select(s => CronExpression.Parse(s)).ToArray();
            while (!token.IsCancellationRequested) {
                DateTimeOffset? next = expressions.Select(e => e.GetNextOccurrence(DateTimeOffset.Now, TimeZoneInfo.Local, true)).Min();

                if (next.HasValue) {
                    var delay = next.Value - DateTimeOffset.Now;
                    try {
                        await Task.Delay((int)delay.TotalMilliseconds, token);
                    } catch (TaskCanceledException) {
                        _logger.LogInformation($"SearchRefreshWorker stopping: task cancelled");
                        return;
                    }

                    _logger.LogInformation($"SearchRefresh started ({DateTime.Now:s})");
                    await DoRefresh(token);
                    _logger.LogInformation($"SearchRefresh completed ({DateTime.Now:s})");
                } else {
                    _logger.LogInformation($"SearchRefreshWorker stopping: no more occurrences");
                    return;
                }
            }
            _logger.LogInformation("SearchRefreshWorker stopping");
        }

        public async Task DoRefresh(CancellationToken token) {
            using (IServiceScope scope = _provider.CreateScope())
            using (HttpClient client = new HttpClient()) {
                List<Task> tasks = new List<Task>();

                IIndeedAPI? indeed = scope.ServiceProvider.GetService<IIndeedAPI>();
                if (indeed != null) {
                    tasks.Add(indeed.SearchAllAsync(client, token));
                } else {
                    _logger.LogError("SearchRefresh: failed to get instance of IndeedAPI");
                }

                await Task.WhenAll(tasks);
            }
        }

        public Task StopAsync(CancellationToken token) {
            return Task.CompletedTask;
        }
    }
}