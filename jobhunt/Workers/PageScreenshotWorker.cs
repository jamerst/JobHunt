using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Cronos;
using OpenQA.Selenium.Firefox;
using SkiaSharp;
using WebDriverManager;
using WebDriverManager.DriverConfigs.Impl;

using JobHunt.Models;
using JobHunt.Configuration;
using JobHunt.Services;

namespace JobHunt.Workers {
    public class PageScreenshotWorker : IHostedService {
        private readonly IWatchedPageChangeService _wpcService;
        private readonly SearchOptions _options;
        private readonly ILogger _logger;


        public PageScreenshotWorker(IWatchedPageChangeService wpcService, IOptions<SearchOptions> options, ILogger<PageScreenshotWorker> logger) {
            _wpcService = wpcService;
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

        private async Task<int> TakeScreenshotsAsync(CancellationToken token) {
            List<WatchedPageChange> pages = await _wpcService.Set
                .Include(c => c.WatchedPage)
                .Where(c => string.IsNullOrEmpty(c.ScreenshotFileName))
                .ToListAsync();

            if (pages.Any()) {
                new DriverManager().SetUpDriver(new FirefoxConfig());
                var driver = new FirefoxDriver();
                driver.Manage().Window.Size = new System.Drawing.Size(1920, 1080);

                foreach (var page in pages) {
                    if (token.IsCancellationRequested) {
                        break;
                    }

                    driver.Navigate().GoToUrl(page.WatchedPage.Url);
                    var screenshot = driver.GetFullPageScreenshot();

                    page.ScreenshotFileName = Path.GetRandomFileName();
                    string savePath = Path.Combine(_options.ScreenshotDirectory, page.ScreenshotFileName);

                    using (var img = SKBitmap.Decode(screenshot.AsByteArray)) {
                        using (var output = File.OpenWrite(savePath))
                            img.Encode(SKEncodedImageFormat.Webp, _options.ScreenshotQuality).SaveTo(output);
                    }
                }

                await _wpcService.SaveChangesAsync();
            }

            return pages.Count;
        }

        public Task StopAsync(CancellationToken token) {
            return Task.CompletedTask;
        }
    }
}