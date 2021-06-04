using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

using AngleSharp;
using AngleSharp.Html.Parser;

using JobHunt.Models;
using JobHunt.Services;

namespace JobHunt.Searching {
    public class PageWatcher : IPageWatcher {
        private readonly IWatchedPageService _wpService;
        private readonly IAlertService _alertService;
        public PageWatcher(IAlertService alertService, IWatchedPageService wpService) {
            _alertService = alertService;
            _wpService = wpService;
        }

        public async Task RefreshAllAsync(HttpClient client, CancellationToken token) {
            List<WatchedPage> pages = await _wpService.GetAllActiveAsync();

            foreach(WatchedPage page in pages) {
                if (token.IsCancellationRequested) {
                    break;
                }

                await RefreshAsync(page, client, token);
            }
        }

        public async Task RefreshAsync(WatchedPage page, HttpClient client, CancellationToken token) {
            string response = "";
            using (var httpResponse = await client.GetAsync(page.Url, HttpCompletionOption.ResponseHeadersRead)) {
                if (httpResponse.IsSuccessStatusCode) {
                    response = await httpResponse.Content.ReadAsStringAsync();
                } else {
                    await _wpService.UpdateStatusAsync(page.Id, null, $"Request failed, HTTP {(int)httpResponse.StatusCode}");
                    return;
                }
            }

            if (string.IsNullOrEmpty(response)) {
                await _wpService.UpdateStatusAsync(page.Id, null, "No content returned");
                return;
            }

            if (token.IsCancellationRequested) {
                return;
            }

            var context = BrowsingContext.New();
            var document = await context.OpenAsync(req => req.Content(response));

            string cssSelector = "body";
            if (!string.IsNullOrEmpty(page.CssSelector)) {
                cssSelector = page.CssSelector;
            }

            if (!string.IsNullOrEmpty(page.CssBlacklist)) {
                foreach (var elem in document.QuerySelectorAll(page.CssBlacklist)) {
                    elem.Remove();
                }
            }

            var elems = document.QuerySelectorAll(cssSelector);
            StringBuilder elemsHtml = new StringBuilder();
            foreach(var elem in elems) {
                elemsHtml.Append(elem.ToHtml());
            }

            string content = elemsHtml.ToString();
            if (string.IsNullOrEmpty(content)) {
                await _wpService.UpdateStatusAsync(page.Id, null, "No content matching CSS selector");
                return;
            }

            string hash = "";
            using (var sha1 = new SHA1Managed()) {
                hash = Convert.ToBase64String(sha1.ComputeHash(Encoding.UTF8.GetBytes(content)));
            }

            if (hash != page.Hash) {
                await _alertService.CreateAsync(new Alert {
                    Type = AlertType.PageUpdate,
                    Title = $"{page.Company.Name} page updated",
                    Message = $"'{page.Url}' content has changed",
                    Url = $"/company/{page.Company.Id}"
                });
            }

            await _wpService.UpdateStatusAsync(page.Id, hash);
        }
    }

    public interface IPageWatcher {
        Task RefreshAllAsync(HttpClient client, CancellationToken token);
        Task RefreshAsync(WatchedPage page, HttpClient client, CancellationToken token);
    }
}