using Cronos;

using JobHunt.PageWatcher;
using JobHunt.Searching.Indeed;

namespace JobHunt.Workers;
public class SearchRefreshWorker : BackgroundService, ISearchRefreshWorker
{
    private readonly IServiceProvider _provider;
    private readonly SearchOptions _options;
    private readonly ILogger _logger;

    public SearchRefreshWorker(IServiceProvider provider, IOptions<SearchOptions> options, ILogger<SearchRefreshWorker> logger)
    {
        _provider = provider;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken token)
    {
        _logger.LogInformation("SearchRefreshWorker started");
        if (_options.Schedules == null)
        {
            _logger.LogWarning("No search refresh schedule provided. Stopping.");
            return;
        }
        CronExpression[] expressions = _options.Schedules.Select(s => CronExpression.Parse(s)).ToArray();
        while (!token.IsCancellationRequested)
        {
            DateTimeOffset? next = expressions.Select(e => e.GetNextOccurrence(DateTimeOffset.Now, TimeZoneInfo.Local, true)).Min();

            if (next.HasValue)
            {
                var delay = next.Value - DateTimeOffset.Now;
                try
                {
                    await Task.Delay((int) delay.TotalMilliseconds, token);
                }
                catch (TaskCanceledException)
                {
                    _logger.LogInformation("SearchRefreshWorker stopping: task cancelled");
                    return;
                }

                _logger.LogInformation("SearchRefresh started");
                try
                {
                    await DoRefreshAsync(token);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Uncaught SearchRefreshWorker exception");
                }
                _logger.LogInformation("SearchRefresh completed");
            }
            else
            {
                _logger.LogInformation("SearchRefreshWorker stopping: no more occurrences");
                return;
            }
        }
        _logger.LogInformation("SearchRefreshWorker stopping");
    }

    public async Task DoRefreshAsync(CancellationToken token)
    {
        // needs multiple separate scopes to prevent threading issues with DbContext
        using (IServiceScope indeedScope = _provider.CreateScope())
        using (IServiceScope pageScope = _provider.CreateScope())
        {
            List<Task> tasks = new List<Task>();

            IIndeedApiSearchProvider? indeed = indeedScope.ServiceProvider.GetService<IIndeedApiSearchProvider>();
            if (indeed != null)
            {
                tasks.Add(indeed.SearchAllAsync(token));
            }
            else
            {
                _logger.LogError("SearchRefreshWorker: failed to get instance of IndeedAPI");
            }

            IPageWatcher? pageWatcher = pageScope.ServiceProvider.GetService<IPageWatcher>();
            if (pageWatcher != null)
            {
                tasks.Add(pageWatcher.RefreshAllAsync(token));
            }
            else
            {
                _logger.LogError("SearchRefreshWorker: failed to get instance of PageWatcher");
            }


            await Task.WhenAll(tasks);
        }
    }
}

public interface ISearchRefreshWorker
{
    Task DoRefreshAsync(CancellationToken token);
}