namespace JobHunt.Extensions;
public static class NumberExtensions
{
    public static string ToOrdinalString(this int number)
    {
        switch (number)
        {
            case int p when p % 100 == 11:
            case int q when q % 100 == 12:
            case int r when r % 100 == 13:
                return $"{number}th";
            case int p when p % 10 == 1:
                return $"{number}st";
            case int p when p % 10 == 2:
                return $"{number}nd";
            case int p when p % 10 == 3:
                return $"{number}rd";
            default:
                return $"{number}th";
        }
    }
}