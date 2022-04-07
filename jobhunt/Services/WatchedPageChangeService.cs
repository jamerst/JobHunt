using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

using AngleSharp;
using AngleSharp.Dom;
using AngleSharp.Html.Parser;
using AngleSharp.Diffing;
using AngleSharp.Diffing.Core;
using AngleSharp.Diffing.Strategies;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

using JobHunt.Configuration;
using JobHunt.Data;
using JobHunt.Diffing;
using JobHunt.DTO;
using JobHunt.Models;

namespace JobHunt.Services {
    public class WatchedPageChangeService : BaseService<WatchedPageChange>, IWatchedPageChangeService {
        private readonly ScreenshotOptions _options;

        public WatchedPageChangeService(JobHuntContext context, IOptions<ScreenshotOptions> options) : base(context) {
            _options = options.Value;
        }

        public async Task<WatchedPageChange?> GetLatestChangeOrDefaultAsync(int watchedPageId) {
            return await _context.WatchedPageChanges
                .Where(c => c.WatchedPageId == watchedPageId)
                .OrderByDescending(c => c.Created)
                .FirstOrDefaultAsync();
        }

        public async Task<List<WatchedPageChangeDto>> FindAllChangesAsync(int watchedPageId) {
            return await _context.WatchedPageChanges
                .Where(c => c.WatchedPageId == watchedPageId)
                .OrderByDescending(c => c.Created)
                .Select(c => new WatchedPageChangeDto {
                    Id = c.Id,
                    Created = c.Created
                })
                .ToListAsync();
        }

        public async Task CreateAsync(WatchedPageChange change) {
            _context.WatchedPageChanges.Add(change);
            await _context.SaveChangesAsync();
        }

        public async Task<Stream?> GetScreenshotAsync(int changeId) {
            WatchedPageChange? change = await _context.WatchedPageChanges.FirstOrDefaultAsync(c => c.Id == changeId);

            if (change == default || string.IsNullOrEmpty(change.ScreenshotFileName)) {
                return null;
            }

            string filePath = Path.Combine(_options.Directory, change.ScreenshotFileName);
            if (!File.Exists(filePath)) {
                return null;
            }

            return new FileStream(Path.Combine(_options.Directory, change.ScreenshotFileName), FileMode.Open, FileAccess.Read);
        }

        public async Task<(string?, string?)> GetDiffHtmlAsync(int changeId) {
            WatchedPageChange? change = await _context.WatchedPageChanges
                .Include(c => c.WatchedPage)
                .FirstOrDefaultAsync(c => c.Id == changeId);
            if (change == default) {
                return (null, null);
            }

            WatchedPageChange? previousChange = await _context.WatchedPageChanges
                .Where(c => c.WatchedPageId == change.WatchedPageId && c.Id != change.Id && c.Created <= change.Created)
                .OrderByDescending(c => c.Created)
                .FirstOrDefaultAsync();

            var context = BrowsingContext.New();
            var current = await context.OpenAsync(r => r.Content(change.Html));
            current.ReplaceRelativeUrlsWithAbsolute(change.WatchedPage.Url);

            if (previousChange == default) {

                return (null, current.ToHtml());
            }

            var previous = await context.OpenAsync(r => r.Content(previousChange.Html));

            previous.ReplaceRelativeUrlsWithAbsolute(change.WatchedPage.Url);

            var diffStrategy = new DiffingStrategyPipeline();
            // diffStrategy.AddDefaultOptions();
            // diffStrategy.IgnoreComments();
            // diffStrategy.AddSearchingNodeMatcher();
            // diffStrategy.AddElementComparer();
            // diffStrategy.AddTextComparer(AngleSharp.Diffing.Strategies.TextNodeStrategies.WhitespaceOption.Normalize, false);
            diffStrategy.IgnoreDiffAttributes();
            diffStrategy.IgnoreComments();
            diffStrategy.AddSearchingNodeMatcher();
            diffStrategy.AddCssSelectorMatcher();
            diffStrategy.AddAttributeNameMatcher();
            diffStrategy.AddElementComparer();
            diffStrategy.AddIgnoreElementSupport();
            diffStrategy.AddStyleSheetComparer();
            diffStrategy.AddTextComparer(AngleSharp.Diffing.Strategies.TextNodeStrategies.WhitespaceOption.Normalize, ignoreCase: false);
            // diffStrategy.AddAttributeComparer();
            // diffStrategy.AddClassAttributeComparer();
            // diffStrategy.AddBooleanAttributeComparer(AngleSharp.Diffing.Strategies.AttributeStrategies.BooleanAttributeComparision.Strict);
            // diffStrategy.AddStyleAttributeComparer();
            diffStrategy.AddAttributeWhitelistComparer("href", "src");
            diffStrategy.AddCssWhitelistBlacklistFilter(change.WatchedPage.CssSelector, change.WatchedPage.CssBlacklist);

            var comparer = new HtmlDiffer(diffStrategy);
            var diffs = comparer.Compare(
                previous.Body ?? throw new InvalidOperationException("Body of previous was null"),
                current.Body ?? throw new InvalidOperationException("Body of current was null")
            );

            foreach (var diff in diffs) {
                if (diff.Target == DiffTarget.Element) {
                    diff.SetDiffAttributes<ComparisonSource>(x => (IElement) x.Node);
                } else if (diff.Target == DiffTarget.Attribute) {
                    diff.SetDiffAttributes<AttributeComparisonSource>(x => (IElement) x.ElementSource.Node, "data-modified");
                } else if (diff.Target == DiffTarget.Text) {
                    diff.SetDiffAttributes<ComparisonSource>(x => x.Node.ParentElement ?? throw new InvalidOperationException("Parent element for text node not found"));
                }
            }

            previous.Head?.Prepend(new HtmlParser().ParseFragment(_changeStyles, previous.Head).First());
            current.Head?.Prepend(new HtmlParser().ParseFragment(_changeStyles, current.Head).First());

            return (previous.ToHtml(), current.ToHtml());
        }

        private const string _changeStyles = @"<style>[data-added=""true""]{outline: 2px solid #4CAF50;}[data-removed=""true""]{outline: 2px solid #F44336}[data-modified=""true""]{outline: 2px solid #FFD54F}</style>";
    }

    public interface IWatchedPageChangeService : IBaseService<WatchedPageChange> {
        Task<WatchedPageChange?> GetLatestChangeOrDefaultAsync(int watchedPageId);
        Task<List<WatchedPageChangeDto>> FindAllChangesAsync(int watchedPageId);
        Task CreateAsync(WatchedPageChange change);
        Task<Stream?> GetScreenshotAsync(int changeId);
        Task<(string?, string?)> GetDiffHtmlAsync(int changeId);
    }
}