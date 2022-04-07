using System.Collections.Generic;
using System.Linq;

using AngleSharp.Dom;
using AngleSharp.Diffing.Core;

namespace JobHunt.Diffing {
    public class AttributeWhitelistComparer {
        public IEnumerable<string> Whitelist { get; set; }

        public AttributeWhitelistComparer(IEnumerable<string> allowedAttributes) {
            Whitelist = allowedAttributes;
        }

        public CompareResult Compare(in AttributeComparison comparison, CompareResult currentDecision) {
            if (currentDecision.IsSameOrSkip()) return currentDecision;

            if (Whitelist.Contains(comparison.Control.Attribute.Name) && Whitelist.Contains(comparison.Control.Attribute.Name)) {
                return comparison.Control.Attribute.Value == comparison.Test.Attribute.Value
                    ? CompareResult.Same
                    : CompareResult.Different;
            } else {
                return CompareResult.Skip;
            }
        }
    }
}