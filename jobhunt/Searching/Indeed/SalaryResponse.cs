using System.Globalization;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace JobHunt.Searching.Indeed;

public class SalaryResponse
{
    [JsonPropertyName("sEx")]
    public Salary? ExpectedSalary { get; set; }

    [JsonPropertyName("ssT")]
    public string? FormattedSalary { get; set; }

    /// <summary>
    /// Get the correct average and formatted salary.
    /// This method works around several problems with the raw Indeed salary response to get clean and accurate data
    /// </summary>
    /// <returns>Tuple of formatted salary string and average yearly salary</returns>
    public (string?, int?) GetSalary()
    {
        bool formattedHasUnit = true;
        string? formatted = FormattedSalary;
        double? average = ExpectedSalary?.Average;
        int? yearly = null;

        if (ExpectedSalary != null)
        {
            if (!string.IsNullOrEmpty(ExpectedSalary?.Range))
            {
                var match = _rangeRegex.Match(ExpectedSalary.Range);
                if (match.Success)
                {
                    if (double.TryParse(match.Groups["lower"].Value, NumberStyles.Number, CultureInfo.InvariantCulture, out double lower))
                    {
                        if (match.Groups.ContainsKey("upper")
                            && double.TryParse(match.Groups["upper"].Value, NumberStyles.Number, CultureInfo.InvariantCulture, out double upper))
                        {
                            if (lower == 0)
                            {
                                if (string.IsNullOrEmpty(formatted))
                                {
                                    formatted = $"Up to {upper:C0}";
                                    formattedHasUnit = false;
                                }

                                // override value if salary is "Up to £x"
                                // Indeed takes the lower bound of such salaries as £0, so the average is skewed significantly
                                average = upper;
                            }
                            else if (upper == -1)
                            {
                                if (string.IsNullOrEmpty(formatted))
                                {
                                    formatted = $"From {lower:C0}";
                                    formattedHasUnit = false;
                                }

                                // override value if salary is "From £x"
                                // Indeed takes the upper bound of such salaries as £-1, which makes no sense, so just use the lower bound
                                average = lower;
                            }
                            else
                            {
                                if (string.IsNullOrEmpty(formatted))
                                {
                                    formatted = ExpectedSalary.Range;
                                    formattedHasUnit = false;
                                }

                                if (!average.HasValue)
                                {
                                    average = (upper + lower) / 2;
                                }
                            }
                        }
                        else
                        {
                            if (string.IsNullOrEmpty(formatted))
                            {
                                formatted = ExpectedSalary.Range;
                                formattedHasUnit = false;
                            }

                            if (!average.HasValue)
                            {
                                average = lower;
                            }
                        }
                    }
                }
                else if (string.IsNullOrEmpty(formatted))
                {
                    formatted = ExpectedSalary.Range;
                    formattedHasUnit = false;
                }
            }

            string unit = "";
            switch (ExpectedSalary?.Type)
            {
                case SalaryTypes.Yearly:
                    unit = " a year";
                    yearly = (int?) average;
                    break;
                case SalaryTypes.Monthly:
                    unit = " a month";
                    yearly = (int?) (average * 12);
                    break;
                case SalaryTypes.Weekly:
                    unit = " a week";
                    yearly = (int?) (average * 48);
                    break;
                case SalaryTypes.Daily:
                    unit = " a day";
                    yearly = (int?) (average * 48 * 5);
                    break;
                case SalaryTypes.Hourly:
                    unit = " an hour";
                    yearly = (int?) (average * 48 * 5 * 8);
                    break;
            }

            if (!formattedHasUnit)
            {
                formatted = formatted += unit;
            }
        }

        return (formatted, yearly);
    }

    private class SalaryTypes
    {
        public const string Yearly = "YEARLY";
        public const string Monthly = "MONTHLY";
        public const string Weekly = "WEEKLY";
        public const string Daily = "DAILY";
        public const string Hourly = "HOURLY";

    }

    private static readonly Regex _rangeRegex = new Regex(@"[^\d]*(?<lower>[\d,]+)(?: - [^\d-]*(?<upper>[\d,-]+))*");
}

public class Salary
{
    [JsonPropertyName("sAvg")]
    public double Average { get; set; }
    [JsonPropertyName("sRg")]
    public string? Range { get; set; }
    [JsonPropertyName("sT")]
    public string? Type { get; set; }
}