using AngleSharp.Dom;
using AngleSharp.Diffing.Core;

namespace JobHunt.Diffing {
    public class CssWhitelistBlacklistFilter {
        public string? CssWhitelist { get; set; }
        public string? CssBlacklist { get; set; }

        public CssWhitelistBlacklistFilter(string? whitelist, string? blacklist) {
            CssWhitelist = whitelist;
            CssBlacklist = blacklist;
        }

        public FilterDecision Filter(in ComparisonSource source, FilterDecision currentDecision) {
            if (currentDecision.IsExclude()) return currentDecision;

            if (source.Node.NodeType == NodeType.Element && source.Node is IElement elem) {
                if (!string.IsNullOrEmpty(CssWhitelist) && !elem.Matches(CssWhitelist)) {
                    return FilterDecision.Exclude;
                }

                if (!string.IsNullOrEmpty(CssBlacklist) && elem.Matches(CssBlacklist)) {
                    return FilterDecision.Exclude;
                }
            }

            return currentDecision;
        }
    }
}