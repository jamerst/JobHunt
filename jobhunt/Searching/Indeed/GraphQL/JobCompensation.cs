using System.Text.Json.Serialization;


namespace JobHunt.Searching.Indeed.GraphQL;

public class JobCompensation
{
    public Salary? BaseSalary { get; set; }
    public JobEstimatedCompensation? Estimated { get; set; }
    public string? FormattedText { get; set; }
}

public class JobEstimatedCompensation
{
    public Salary BaseSalary { get; set; } = null!;
    public string FormattedText { get; set; } = null!;
    public string GetFormattedText() => $"{FormattedText} (estimated)";
}

public class Salary
{
    public ISalaryType Range { get; set; } = null!;
    public SalaryUnit UnitOfWork { get; set; }

    public int GetAvgYearlySalary()
    {
        int avgSalary = (int)Range.GetAvgSalary();

        return UnitOfWork switch
        {
            SalaryUnit.Year => avgSalary,
            SalaryUnit.Quarter => avgSalary * 4,
            SalaryUnit.Month => avgSalary * 12,
            SalaryUnit.BiWeek => avgSalary * 24,
            SalaryUnit.Week => avgSalary * 48,
            SalaryUnit.Day => avgSalary * 48 * 5,
            SalaryUnit.Hour => avgSalary * 48 * 5 * 8,
            _ => throw new InvalidOperationException($"Unknown salary unit {UnitOfWork}")
        };
    }
}

[JsonPolymorphic(TypeDiscriminatorPropertyName = "__typename")]
[JsonDerivedType(typeof(AtLeastSalary), AtLeastSalary.TypeName)]
[JsonDerivedType(typeof(AtMostSalary), AtMostSalary.TypeName)]
[JsonDerivedType(typeof(ExactlySalary), ExactlySalary.TypeName)]
[JsonDerivedType(typeof(RangeSalary), RangeSalary.TypeName)]
public interface ISalaryType
{
    double GetAvgSalary();
}

public class AtLeastSalary : ISalaryType
{
    public const string TypeName = "AtLeast";

    public double Min { get; set; }

    public double GetAvgSalary()
    {
        return Min;
    }
}

public class AtMostSalary : ISalaryType
{
    public const string TypeName = "AtMost";

    public double Max { get; set; }

    public double GetAvgSalary()
    {
        return Max;
    }
}

public class ExactlySalary : ISalaryType
{
    public const string TypeName = "Exactly";

    public double Value { get; set; }

    public double GetAvgSalary()
    {
        return Value;
    }
}

public class RangeSalary : ISalaryType
{
    public const string TypeName = "Range";

    public double Min { get; set; }
    public double Max { get; set; }

    public double GetAvgSalary()
    {
        if (Min < 1)
        {
            return Max;
        }
        else if (Max < 1)
        {
            return Min;
        }
        else
        {
            return (Min + Max) / 2;
        }
    }
}

public enum SalaryUnit
{
    [Display(Name = "YEAR")]
    Year,

    [Display(Name = "QUARTER")]
    Quarter,

    [Display(Name = "MONTH")]
    Month,

    [Display(Name = "BIWEEK")]
    BiWeek,

    [Display(Name = "WEEK")]
    Week,

    [Display(Name = "DAY")]
    Day,

    [Display(Name = "HOUR")]
    Hour
}