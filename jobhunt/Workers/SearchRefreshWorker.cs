using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Cronos;

using JobHunt.Configuration;
using JobHunt.Searching;

namespace JobHunt.Workers {
    public class SearchRefreshWorker : IHostedService {
        private readonly IServiceProvider _provider;
        private readonly SearchOptions _options;
        private readonly ILogger _logger;
        
        public SearchRefreshWorker(IOptions<SearchOptions> options, ILogger<SearchRefreshWorker> logger) {
            _provider = new ServiceCollection()
                .AddScoped<ISearchProvider, IndeedAPI>()
                .BuildServiceProvider();
            _options = options.Value;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken token) {
            _logger.LogInformation($"SearchRefreshWorker started ({DateTime.Now:u})");
            CronExpression[] expressions = _options.Schedules.Select(s => CronExpression.Parse(s)).ToArray();
            while (!token.IsCancellationRequested) {
                DateTimeOffset? next = expressions.Select(e => e.GetNextOccurrence(DateTimeOffset.Now, TimeZoneInfo.Local, true)).Min();

                if (next.HasValue) {
                    var delay = next.Value - DateTimeOffset.Now;
                    await Task.Delay((int)delay.TotalMilliseconds, token);
                    _logger.LogInformation($"SearchRefresh running ({DateTime.Now:u})");
                    try {
                        await DoRefresh(token);
                    } catch (TaskCanceledException) {
                        _logger.LogInformation($"SearchRefreshWorker stopping: task cancelled");
                        break;
                    }
                    _logger.LogInformation($"SearchRefresh completed ({DateTime.Now:u})");
                } else {
                    _logger.LogInformation($"SearchRefreshWorker stopping: no more occurrences");
                    break;
                }
            }
        }

        public async Task DoRefresh(CancellationToken token) {
            
        }

        public Task StopAsync(CancellationToken token) {
            return Task.CompletedTask;
        }
    }
}