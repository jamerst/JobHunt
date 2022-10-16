using OpenQA.Selenium;
using OpenQA.Selenium.Firefox;

using JobHunt.AngleSharp;

namespace JobHunt.PageWatcher;
public class PageWatcher : IPageWatcher
{
    private readonly IAlertService _alertService;
    private readonly IWatchedPageService _wpService;
    private readonly IWatchedPageChangeService _wpcService;
    private readonly HttpClient _client;
    private readonly ILogger _logger;
    private readonly SearchOptions _options;
    private FirefoxDriver? _driver;

    public PageWatcher(
        IAlertService alertService,
        IWatchedPageService wpService,
        IWatchedPageChangeService wpcService,
        HttpClient client,
        ILogger<PageWatcher> logger,
        IOptions<SearchOptions> options
    )
    {
        _alertService = alertService;
        _wpService = wpService;
        _wpcService = wpcService;
        _client = client;
        _logger = logger;
        _options = options.Value;
    }

    public async Task RefreshAllAsync(CancellationToken token)
    {
        List<WatchedPage> pages = await _wpService.GetAllActiveAsync();

        if (pages.Any(p => p.RequiresJS))
        {
            SetUpWebDriver();
        }

        foreach (WatchedPage page in pages)
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            try
            {
                await _refreshAsync(page, token, false);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Uncaught PageWatcher exception {@WatchedPage}", page);
            }
        }

        _driver?.Dispose();
    }

    public async Task RefreshAsync(WatchedPage page, CancellationToken token)
    {
        await _refreshAsync(page, token, true);
    }

    private async Task _refreshAsync(WatchedPage page, CancellationToken token, bool setUpDriver)
    {
        string response = "";
        if (!page.RequiresJS)
        {
            try
            {
                using (var httpResponse = await _client.GetAsync(page.Url, HttpCompletionOption.ResponseHeadersRead))
                {
                    if (httpResponse.IsSuccessStatusCode)
                    {
                        response = await httpResponse.Content.ReadAsStringAsync();
                    }
                    else
                    {
                        await _wpService.UpdateStatusAsync(page.Id, statusMessage: $"Request failed, HTTP {(int) httpResponse.StatusCode}");
                        return;
                    }
                }
            }
            catch (HttpRequestException e)
            {
                _logger.LogError(e, "HTTP Request failed for {url}", page.Url);
                await _wpService.UpdateStatusAsync(page.Id, statusMessage: "HTTP request error");
                return;
            }
        }
        else
        {
            if (setUpDriver && _driver == null)
            {
                SetUpWebDriver();
            }

            if (_driver == null)
            {
                await _wpService.UpdateStatusAsync(page.Id, statusMessage: "Failed to setup webdriver");
                return;
            }

            // check HTTP response code first
            try
            {
                var statusCode = await _client.GetStatusCodeAsync(page.Url);

                if (!statusCode.IsSuccessStatusCode())
                {
                    await _wpService.UpdateStatusAsync(page.Id, statusMessage: $"Request failed, HTTP {(int) statusCode}");
                    return;
                }
            }
            catch (HttpRequestException e)
            {
                _logger.LogError(e, "HTTP Request failed for {url}", page.Url);
                await _wpService.UpdateStatusAsync(page.Id, statusMessage: "HTTP request error");
                return;
            }

            _driver.Navigate().GoToUrl(page.Url);

            // wait for page to load and SPA to initialise
            await Task.Delay(TimeSpan.FromSeconds(_options.PageLoadWaitSeconds));

            response = _driver.PageSource;
        }

        if (string.IsNullOrEmpty(response))
        {
            await _wpService.UpdateStatusAsync(page.Id, statusMessage: "No content returned");
            return;
        }

        if (token.IsCancellationRequested)
        {
            return;
        }

        WatchedPageChange? previous = await _wpcService.GetLatestChangeOrDefaultAsync(page.Id);
        if (previous == default)
        {
            await _wpcService.CreateAsync(new WatchedPageChange
            {
                WatchedPageId = page.Id,
                Created = DateTimeOffset.UtcNow,
                Html = response
            });

            await _wpService.UpdateStatusAsync(page.Id, true);
            return;
        }

        bool changed = false;
        var diffs = await JobHuntComparer.CompareAsync(previous.Html, response, page.CssSelector, page.CssBlacklist);

        if (diffs.Any())
        {
            changed = true;

            WatchedPageChange? change = await _wpcService.CreateAsync(new WatchedPageChange
            {
                WatchedPageId = page.Id,
                Created = DateTimeOffset.UtcNow,
                Html = response
            });

            if (change != null)
            {
                await _alertService.CreateAsync(new Alert
                {
                    Type = AlertType.PageUpdate,
                    Title = $"{page.Company.Name} page updated",
                    Message = $"'{page.Url}' content has changed",
                    Url = $"/page-changes/{change.Id}"
                });
            }
        }

        await _wpService.UpdateStatusAsync(page.Id, changed);
    }

    private void SetUpWebDriver()
    {
        try
        {
            var options = new FirefoxOptions();
            options.AddArgument("-headless");

            _driver = new FirefoxDriver(options);
        }
        catch (WebDriverException ex)
        {
            _logger.LogError(ex, "FirefoxDriver setup failed");
        }
    }
}

public interface IPageWatcher
{
    Task RefreshAllAsync(CancellationToken token);
    Task RefreshAsync(WatchedPage page, CancellationToken token);
}