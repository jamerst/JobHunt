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
using WebDriverManager;
using WebDriverManager.DriverConfigs.Impl;

using JobHunt.Models;
using JobHunt.Configuration;
using JobHunt.Services;

namespace JobHunt.Workers {
    public class PageScreenshotWorker : IHostedService, IPageScreenshotWorker {
        private readonly IServiceProvider _provider;
        private readonly SearchOptions _options;
        private readonly ILogger _logger;

        public PageScreenshotWorker(IServiceProvider provider, IOptions<SearchOptions> options, ILogger<PageScreenshotWorker> logger) {
            _provider = provider;
            _options = options.Value;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken token) {
            _logger.LogInformation("PageScreenshotWorker started");
            if (string.IsNullOrEmpty(_options.ScreenshotSchedule)) {
                _logger.LogWarning("No screenshot schedule provided. Stopping.");
                return;
            }

            CronExpression expression = CronExpression.Parse(_options.ScreenshotSchedule);
            while (!token.IsCancellationRequested) {
                DateTimeOffset? next = expression.GetNextOccurrence(DateTimeOffset.Now, TimeZoneInfo.Local, true);

                if (next.HasValue) {
                    var delay = next.Value - DateTimeOffset.Now;
                    try {
                        await Task.Delay((int) delay.TotalMilliseconds, token);
                    } catch (TaskCanceledException) {
                        _logger.LogInformation("PageScreenshotWorker stopping: task cancelled");
                    }

                    int numScreenshots = await TakeScreenshotsAsync(token);
                    if (numScreenshots > 0) {
                        _logger.LogInformation("PageScreenshotWorker completed: took {numScreenshots} screenshots", numScreenshots);
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
                            new DriverManager().SetUpDriver(new FirefoxConfig());
                            var options = new FirefoxOptions();
                            options.AddArgument("-headless");
                            driver = new FirefoxDriver(options);
                            driver.Manage().Window.Size = new System.Drawing.Size(1920, 1080);
                        } catch (WebDriverException ex) {
                            _logger.LogError(ex, "FirefoxDriver setup failed");
                            return 0;
                        }

                        foreach (var page in pages) {
                            if (token.IsCancellationRequested) {
                                break;
                            }

                            // go to page
                            driver.Navigate().GoToUrl(page.WatchedPage.Url);
                            // scroll all the way down to ensure lazy images are loaded
                            driver.ExecuteScript("window.scrollTo(0, document.body.scrollHeight);");

                            // var heightResult = driver.ExecuteScript("return document.body.scrollHeight");
                            // if (int.TryParse(heightResult as string, out int pageHeight)) {
                            //     driver.Manage().Window.Size = new System.Drawing.Size(1920, pageHeight);
                            // }

                            WebDriverWait imageWait = new WebDriverWait(driver, TimeSpan.FromSeconds(_options.ScreenshotPageLoadTimeout));
                            imageWait.Until(d => {
                                d.FindElements(By.TagName("img")).All(e => {
                                    var result = ((FirefoxDriver) d).ExecuteScript("return arguments[0].complete", e);

                                    return bool.TryParse(result as string, out bool completed) && completed;
                                });

                                return "";
                            });

                            var screenshot = driver.GetFullPageScreenshot();

                            if (!Directory.Exists(_options.ScreenshotDirectory)) {
                                Directory.CreateDirectory(_options.ScreenshotDirectory);
                            }

                            page.ScreenshotFileName = Path.GetRandomFileName();
                            string savePath = Path.Combine(_options.ScreenshotDirectory, page.ScreenshotFileName);

                            using (var img = SKBitmap.Decode(screenshot.AsByteArray)) {
                                using (var output = File.OpenWrite(savePath))
                                    img.Encode(SKEncodedImageFormat.Webp, _options.ScreenshotQuality).SaveTo(output);
                            }
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

        public Task StopAsync(CancellationToken token) {
            return Task.CompletedTask;
        }
    }

    public interface IPageScreenshotWorker {
        Task<int> TakeScreenshotsAsync(CancellationToken token);
    }
}