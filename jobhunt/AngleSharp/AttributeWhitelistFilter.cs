using System.Globalization;

using AngleSharp.Dom;
using AngleSharp.Diffing.Core;

namespace JobHunt.AngleSharp;
public class AttributeWhitelistFilter
{
    public IEnumerable<string> Whitelist { get; set; }
    private readonly StringComparer _comparer = StringComparer.Create(CultureInfo.InvariantCulture, true);

    public AttributeWhitelistFilter(IEnumerable<string> allowedAttributes)
    {
        Whitelist = allowedAttributes;
    }

    public FilterDecision Filter(in AttributeComparisonSource source, FilterDecision currentDecision)
    {
        if (currentDecision.IsExclude()) return currentDecision;

        if (!Whitelist.Contains(source.Attribute.Name, _comparer))
        {
            return FilterDecision.Exclude;
        }

        return currentDecision;
    }
}