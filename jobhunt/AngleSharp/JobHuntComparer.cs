using System;
using System.Collections.Generic;
using System.Threading.Tasks;

using AngleSharp;
using AngleSharp.Diffing;
using AngleSharp.Diffing.Core;
using AngleSharp.Diffing.Strategies;
using AngleSharp.Dom;

namespace JobHunt.AngleSharp {
    public static class JobHuntComparer {

        public static async Task<IEnumerable<IDiff>> CompareAsync(string html1, string html2, string? cssSelector, string? cssBlacklist) {
            var context = BrowsingContext.New();

            var doc1 = await context.OpenAsync(r => r.Content(html1));
            var doc2 = await context.OpenAsync(r => r.Content(html2));

            return Compare(doc1, doc2, cssSelector, cssBlacklist);
        }

        public static IEnumerable<IDiff> Compare(IDocument doc1, IDocument doc2, string? cssSelector, string? cssBlacklist) {
            var diffStrategy = new DiffingStrategyPipeline();
            diffStrategy.AddDefaultJobHuntOptions(cssSelector, cssBlacklist);

            var comparer = new HtmlDiffer(diffStrategy);

            return comparer.Compare(
                doc1.Body ?? throw new ArgumentNullException("Body of doc1 was null"),
                doc2.Body ?? throw new ArgumentNullException("Body of doc2 was null")
            );
        }
    }
}