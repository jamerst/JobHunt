using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

using AngleSharp.Dom;
using AngleSharp.Diffing.Core;

namespace JobHunt.AngleSharp {
    public class TagBlacklistFilter {
        public IEnumerable<string> Blacklist { get; set; }
        private readonly StringComparer _comparer = StringComparer.Create(CultureInfo.InvariantCulture, true);

        public TagBlacklistFilter(IEnumerable<string> blacklist) {
            Blacklist = blacklist;
        }

        public FilterDecision Filter(in ComparisonSource source, FilterDecision currentDecision) {
            if (currentDecision.IsExclude()) return currentDecision;

            if (source.Node.NodeType == NodeType.Element && source.Node is IElement elem) {
                if (Blacklist.Contains(elem.TagName, _comparer)) {
                    return FilterDecision.Exclude;
                }
            }

            return currentDecision;
        }
    }
}