using System;

using AngleSharp.Dom;
using AngleSharp.Diffing;
using AngleSharp.Diffing.Core;
using AngleSharp.Diffing.Strategies;
using AngleSharp.Diffing.Strategies.TextNodeStrategies;

using JobHunt.Extensions;

namespace JobHunt.AngleSharp {
    public static class DiffingStrategyCollectionExtensions {
        public static IDiffingStrategyCollection AddCssWhitelistBlacklistFilter(this IDiffingStrategyCollection builder, string? cssWhitelist, string? cssBlacklist) {
            var filter = new CssWhitelistBlacklistFilter(cssWhitelist, cssBlacklist);

            builder.AddFilter(filter.Filter);

            return builder;
        }

        public static IDiffingStrategyCollection AddTagBlacklistFilter(this IDiffingStrategyCollection builder, params string[] blacklist) {
            var filter = new TagBlacklistFilter(blacklist);

            builder.AddFilter(filter.Filter);

            return builder;
        }

        public static IDiffingStrategyCollection AddAttributeWhitelistFilter(this IDiffingStrategyCollection builder, params string[] allowedAttributes) {
            var filter = new AttributeWhitelistFilter(allowedAttributes);

            builder.AddFilter(filter.Filter);

            return builder;
        }

        public static IDiffingStrategyCollection AddDefaultJobHuntOptions(this IDiffingStrategyCollection builder, string? cssWhitelist, string? cssBlacklist) {
            builder.IgnoreComments();
            builder.AddSearchingNodeMatcher();
            builder.AddAttributeNameMatcher();
            builder.AddElementComparer();
            builder.AddTextComparer(WhitespaceOption.Normalize, ignoreCase: false);
            builder.AddAttributeComparer();

            builder.AddTagBlacklistFilter(TagNames.Script, TagNames.Link);
            builder.AddCssWhitelistBlacklistFilter(cssWhitelist, cssBlacklist);
            builder.AddAttributeWhitelistFilter(AttributeNames.Href, AttributeNames.Src, AttributeNames.SrcSet);

            return builder;
        }
    }

    public static class DiffExtensions {
        public static void SetDiffAttributes<T>(this IDiff diff, Func<T, IElement> getElement, string? attrKey = null) where T : struct {
            if (diff.Result == DiffResult.Different && diff is DiffBase<T> db) {
                IElement targetControl = getElement(db.Control);
                targetControl.SetAttribute(attrKey ?? "data-modified", "true");

                IElement targetTest = targetTest = getElement(db.Test);
                targetTest.SetAttribute(attrKey ?? "data-modified", "true");
            } else if (diff.Result == DiffResult.Missing && diff is MissingDiffBase<T> mdb) {
                IElement target = getElement(mdb.Control);
                target.SetAttribute(attrKey ?? "data-removed", "true");
            } else if (diff.Result == DiffResult.Unexpected && diff is UnexpectedDiffBase<T> udb) {
                IElement target = getElement(udb.Test);
                target.SetAttribute(attrKey ?? "data-added", "true");
            }
        }
    }

    public static class DocumentExtensions {
        public static void ReplaceRelativeUrlsWithAbsolute(this IDocument doc, string url) {
            foreach (var elem in doc.QuerySelectorAll("img, script")) {
                var src = elem.GetAttribute("src");
                if (src != null && Uri.TryCreate(src, UriKind.RelativeOrAbsolute, out Uri? srcUri)) {
                    if (srcUri.IsRelativeHttpUri(src)) {
                        elem.SetAttribute("src", new Uri(new Uri(url), srcUri).AbsoluteUri);
                    }
                }
            }

            foreach (var elem in doc.QuerySelectorAll("a, link")) {
                var href = elem.GetAttribute("href");
                if (href != null && Uri.TryCreate(href, UriKind.RelativeOrAbsolute, out Uri? hrefUri)) {
                    if (hrefUri.IsRelativeHttpUri(href)) {
                        elem.SetAttribute("href", new Uri(new Uri(url), hrefUri).AbsoluteUri);
                    }
                }
            }
        }
    }
}