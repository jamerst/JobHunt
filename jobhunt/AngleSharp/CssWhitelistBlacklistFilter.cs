using System.Collections.Generic;
using System.Linq;

using AngleSharp.Dom;
using AngleSharp.Diffing.Core;

namespace JobHunt.AngleSharp {
    public class CssWhitelistBlacklistFilter {
        private List<INode> _matchingNodes = new List<INode>();

        public string? CssWhitelist { get; set; }
        public string? CssBlacklist { get; set; }

        public CssWhitelistBlacklistFilter(string? whitelist, string? blacklist) {
            CssWhitelist = whitelist;
            CssBlacklist = blacklist;
        }

        public FilterDecision Filter(in ComparisonSource source, FilterDecision currentDecision) {
            if (currentDecision.IsExclude()) return currentDecision;

            var node = source.Node; // needed because in parameters can't be used in lambdas?
            if (node.NodeType == NodeType.Element && node is IElement elem) {
                if (!string.IsNullOrEmpty(CssWhitelist)) {
                    if (elem.Matches(CssWhitelist)) { // whitelist matches element
                        _matchingNodes.Add(node);
                        return FilterDecision.Keep;
                    } else if (_matchingNodes.Any(n => node.IsDescendantOf(n))) { // descendent of a matched element
                        return FilterDecision.Keep;
                    } else if (elem.GetDescendants().Any(n => n is IElement e && e.Matches(CssWhitelist))) { // parent of a matched element
                        return FilterDecision.Keep;
                    } else {
                        return FilterDecision.Exclude;
                    }
                }

                if (!string.IsNullOrEmpty(CssBlacklist) && elem.Matches(CssBlacklist)) {
                    return FilterDecision.Exclude;
                }
            }

            return currentDecision;
        }
    }
}