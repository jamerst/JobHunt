using System;

using AngleSharp.Dom;
using AngleSharp.Diffing.Core;
using AngleSharp.Diffing.Strategies;

namespace JobHunt.Diffing {
    public static class DiffingStrategyCollectionExtensions {
        public static IDiffingStrategyCollection AddCssWhitelistBlacklistFilter(this IDiffingStrategyCollection builder, string? cssWhitelist, string? cssBlacklist) {
            CssWhitelistBlacklistFilter filter = new CssWhitelistBlacklistFilter(cssWhitelist, cssBlacklist);

            builder.AddFilter(filter.Filter);

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
}