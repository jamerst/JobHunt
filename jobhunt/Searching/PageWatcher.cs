using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.Extensions.Logging;

using AngleSharp;
using AngleSharp.Diffing;

using JobHunt.Diffing;
using JobHunt.Models;
using JobHunt.Services;

namespace JobHunt.Searching {
    public class PageWatcher : IPageWatcher {
        private readonly IAlertService _alertService;
        private readonly IWatchedPageService _wpService;
        private readonly IWatchedPageChangeService _wpcService;
        private readonly HttpClient _client;
        private readonly ILogger _logger;
        public PageWatcher(IAlertService alertService, IWatchedPageService wpService, IWatchedPageChangeService wpcService, HttpClient client, ILogger<PageWatcher> logger) {
            _alertService = alertService;
            _wpService = wpService;
            _wpcService = wpcService;
            _client = client;
            _logger = logger;
        }

        public async Task RefreshAllAsync(CancellationToken token) {
            List<WatchedPage> pages = await _wpService.GetAllActiveAsync();

            foreach(WatchedPage page in pages) {
                if (token.IsCancellationRequested) {
                    break;
                }

                try {
                    await RefreshAsync(page, token);
                } catch (Exception e) {
                    _logger.LogError(e, "Uncaught PageWatcher exception {WatchedPage}", page);
                }
            }
        }

        public async Task RefreshAsync(WatchedPage page, CancellationToken token) {
            string response = "";
            try {
                using (var httpResponse = await _client.GetAsync(page.Url, HttpCompletionOption.ResponseHeadersRead)) {
                    if (httpResponse.IsSuccessStatusCode) {
                        response = await httpResponse.Content.ReadAsStringAsync();
                    } else {
                        await _wpService.UpdateStatusAsync(page.Id, statusMessage: $"Request failed, HTTP {(int)httpResponse.StatusCode}");
                        return;
                    }
                }
            } catch (HttpRequestException e) {
                _logger.LogError(e, $"HTTP Request failed", page);
                await _wpService.UpdateStatusAsync(page.Id, statusMessage: "HTTP request error");
                return;
            }

            if (string.IsNullOrEmpty(response)) {
                await _wpService.UpdateStatusAsync(page.Id, statusMessage: "No content returned");
                return;
            }

            if (token.IsCancellationRequested) {
                return;
            }

            WatchedPageChange? previous = await _wpcService.GetLatestChangeOrDefaultAsync(page.Id);
            if (previous == default) {
                await _wpcService.CreateAsync(new WatchedPageChange {
                    WatchedPageId = page.Id,
                    Created = DateTime.UtcNow,
                    Html = response
                });

                return;
            }

            bool changed = false;

            var diffs = DiffBuilder
                .Compare(previous.Html)
                .WithTest(response)
                .WithOptions(options => options
                    .AddDefaultOptions()
                    .AddCssWhitelistBlacklistFilter(page.CssSelector, page.CssBlacklist))
                .Build();

            if (diffs.Any()) {
                changed = true;

                await _wpcService.CreateAsync(new WatchedPageChange {
                    WatchedPageId = page.Id,
                    Created = DateTime.UtcNow,
                    Html = response
                });

                await _alertService.CreateAsync(new Alert {
                    Type = AlertType.PageUpdate,
                    Title = $"{page.Company.Name} page updated",
                    Message = $"'{page.Url}' content has changed",
                    Url = $"/company/{page.Company.Id}#watched-pages"
                });
            }

            await _wpService.UpdateStatusAsync(page.Id, changed);
        }

        public async Task GetInitialAsync(int companyId, CancellationToken token) {
            List<WatchedPage> pages = await _wpService.GetUnfetchedAsync(companyId);

            foreach(WatchedPage page in pages) {
                if (token.IsCancellationRequested) {
                    break;
                }

                await RefreshAsync(page, token);
            }
        }

        public async Task RefreshCompanyAsync(int companyId, CancellationToken token) {
            List<WatchedPage> pages = await _wpService.GetByCompanyAsync(companyId);

            foreach(WatchedPage page in pages) {
                if (token.IsCancellationRequested) {
                    break;
                }

                await RefreshAsync(page, token);
            }
        }
    }

    public interface IPageWatcher {
        Task RefreshAllAsync(CancellationToken token);
        Task RefreshAsync(WatchedPage page, CancellationToken token);
        Task GetInitialAsync(int companyId, CancellationToken token);
        Task RefreshCompanyAsync(int companyId, CancellationToken token);
    }
}