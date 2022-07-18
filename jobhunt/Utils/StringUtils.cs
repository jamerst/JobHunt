using System.Text.RegularExpressions;

namespace JobHunt.Utils;

public static class StringUtils
{
    private static Regex _htmlRegex = new Regex(@"<([A-z]+)[^>]*>.*<\/\1>");
    public static bool IsHtml(string str) => _htmlRegex.IsMatch(str);
}