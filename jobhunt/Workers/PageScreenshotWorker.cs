using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Cronos;
using OpenQA.Selenium;
using OpenQA.Selenium.Firefox;
using OpenQA.Selenium.Support.UI;
using SkiaSharp;

using JobHunt.Models;
using JobHunt.Configuration;
using JobHunt.Services;

namespace JobHunt.Workers {
    public class PageScreenshotWorker : BackgroundService, IPageScreenshotWorker {
        private readonly IServiceProvider _provider;
        private readonly ScreenshotOptions _options;
        private readonly ILogger _logger;

        public PageScreenshotWorker(IServiceProvider provider, IOptions<ScreenshotOptions> options, ILogger<PageScreenshotWorker> logger) {
            _provider = provider;
            _options = options.Value;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken token) {
            _logger.LogInformation("PageScreenshotWorker started");
            if (string.IsNullOrEmpty(_options.Schedule)) {
                _logger.LogWarning("No screenshot schedule provided. Stopping.");
                return;
            }

            CronExpression expression = CronExpression.Parse(_options.Schedule);
            while (!token.IsCancellationRequested) {
                DateTimeOffset? next = expression.GetNextOccurrence(DateTimeOffset.Now, TimeZoneInfo.Local, true);

                if (next.HasValue) {
                    var delay = next.Value - DateTimeOffset.Now;
                    try {
                        await Task.Delay((int) delay.TotalMilliseconds, token);
                    } catch (TaskCanceledException) {
                        _logger.LogInformation("PageScreenshotWorker stopping: task cancelled");
                    }

                    try {
                        int numScreenshots = await TakeScreenshotsAsync(token);
                        if (numScreenshots > 0) {
                            _logger.LogInformation("PageScreenshotWorker completed: took {numScreenshots} screenshots", numScreenshots);
                        }
                    } catch (Exception ex) {
                        _logger.LogError(ex, "Uncaught PageScreenshotWorker exception");
                    }

                }
                else {
                    _logger.LogInformation("PageScreenshotWorker stopping: no more occurrences");
                }
            }
            _logger.LogInformation("PageScreenshotWorker stopping");
        }

        public async Task<int> TakeScreenshotsAsync(CancellationToken token) {
            using (IServiceScope scope = _provider.CreateScope()) {
                var wpcService = scope.ServiceProvider.GetService<IWatchedPageChangeService>();

                if (wpcService != null) {
                    List<WatchedPageChange> pages = await wpcService.Set
                        .Include(c => c.WatchedPage)
                        .Where(c => string.IsNullOrEmpty(c.ScreenshotFileName))
                        .ToListAsync();

                    if (pages.Any()) {
                        FirefoxDriver driver;
                        try {
                            var options = new FirefoxOptions();
                            options.AddArgument("-headless");
                            driver = new FirefoxDriver(options);
                            driver.Manage().Window.Size = new System.Drawing.Size(_options.WidthPixels, _options.WidthPixels / 16 * 9);
                        } catch (WebDriverException ex) {
                            _logger.LogError(ex, "FirefoxDriver setup failed");
                            return 0;
                        }

                        try {
                            foreach (var page in pages) {
                                if (token.IsCancellationRequested) {
                                    break;
                                }

                                // go to page
                                driver.Navigate().GoToUrl(page.WatchedPage.Url);

                                // wait for images to load
                                try {
                                    WebDriverWait imageWait = new WebDriverWait(driver, TimeSpan.FromSeconds(_options.PageLoadTimeoutSeconds));
                                    imageWait.Until(d => {
                                        return d.FindElements(By.TagName("img")).All(e => {
                                            var driver = (FirefoxDriver) d;
                                            var result = driver.ExecuteScript("return arguments[0].complete", e);

                                            bool completed = result is bool b && b;

                                            if (!completed) {
                                                // scroll element into view to force loading in case it uses lazy loading
                                                driver.ExecuteScript("arguments[0].scrollIntoView()", e);
                                            }

                                            return completed;
                                        });
                                    });
                                } catch (WebDriverTimeoutException ex) {
                                    _logger.LogWarning(ex, "Timed out waiting for images to load on {url}", page.WatchedPage.Url);
                                }

                                var screenshot = driver.GetFullPageScreenshot();

                                if (!Directory.Exists(_options.Directory)) {
                                    Directory.CreateDirectory(_options.Directory);
                                }

                                page.ScreenshotFileName = Path.GetRandomFileName();
                                string savePath = Path.Combine(_options.Directory, page.ScreenshotFileName);

                                using (var img = SKBitmap.Decode(screenshot.AsByteArray)) {
                                    using (var output = File.OpenWrite(savePath))
                                        img.Encode(SKEncodedImageFormat.Webp, _options.QualityPercent).SaveTo(output);
                                }
                            }
                        } finally {
                            driver.Dispose();
                        }

                        await wpcService.SaveChangesAsync();
                    }

                    return pages.Count;
                }
                else {
                    _logger.LogError("PageScreenshotWorker: failed to get instance of WatchedPageChangeService");
                    return 0;
                }
            }
        }
    }

    public interface IPageScreenshotWorker {
        Task<int> TakeScreenshotsAsync(CancellationToken token);
    }
}