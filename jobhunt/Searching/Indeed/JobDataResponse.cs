using System.Text.Json;
using System.Text.Json.Serialization;

namespace JobHunt.Searching.Indeed;

public class JobDataResponse
{
    public JobDataResults JobData { get; set; } = null!;
}

public class JobDataResults
{
    public List<JobDataResult> Results { get; set; } = null!;
}

public class JobDataResult
{
    public Compensation? Compensation { get; set; }
    public string Key { get; set; } = null!;
}

public class Compensation
{
    public Salary? BaseSalary { get; set; }
    public EstimatedSalary? Estimated { get; set; }
    public string? formattedText { get; set; }
}

public class EstimatedSalary
{
    public Salary BaseSalary { get; set; } = null!;
    public string FormattedText { get; set; } = null!;
}

public class Salary
{
    public SalaryUnit UnitOfWork { get; set; }
}

public interface ISalaryType
{
    double GetAvgSalary();
}

public class AtLeastSalary : ISalaryType
{
    public double Min { get; set; }

    public double GetAvgSalary()
    {
        return Min;
    }
}

public class AtMostSalary : ISalaryType
{
    public double Max { get; set; }

    public double GetAvgSalary()
    {
        return Max;
    }
}

public class ExactlySalary : ISalaryType
{
    public double Value { get; set; }

    public double GetAvgSalary()
    {
        return Value;
    }
}

public class RangeSalary : ISalaryType
{
    public double Min { get; set; }
    public double Max { get; set; }

    public double GetAvgSalary()
    {
        return (Min + Max) / 2;
    }
}

// polymorphic deserializer for ISalaryType
public class SalaryTypeConverter : JsonConverter<ISalaryType>
{
    public override ISalaryType? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        Utf8JsonReader clone = reader;

        string? type = null;
        while (type == null & clone.Read())
        {
            if (clone.TokenType == JsonTokenType.PropertyName)
            {
                if (clone.GetString() == "__typename")
                {
                    clone.Read();

                    if (clone.TokenType == JsonTokenType.String)
                    {
                        type = clone.GetString();
                        break;
                    }
                    else
                    {
                        throw new JsonException($@"Expected ""__typename"" to be a string, was {clone.TokenType}");
                    }
                }
            }
        }

        if (type == null)
        {
            throw new JsonException("__typename property not found");
        }

        if (!Enum.TryParse(type, out SalaryTypeName typeName))
        {
            throw new JsonException($@"Unknown __typename ""{type}""");
        }

        ISalaryType salaryType = typeName switch
        {
            SalaryTypeName.AtLeast => JsonSerializer.Deserialize<AtLeastSalary>(ref reader, options)!,
            SalaryTypeName.AtMost => JsonSerializer.Deserialize<AtMostSalary>(ref reader, options)!,
            SalaryTypeName.Exactly => JsonSerializer.Deserialize<ExactlySalary>(ref reader, options)!,
            SalaryTypeName.Range => JsonSerializer.Deserialize<RangeSalary>(ref reader, options)!,
            _ => throw new JsonException($@"Unknown __typename ""{typeName}""")
        };

        return salaryType;
    }

    public override void Write(Utf8JsonWriter writer, ISalaryType value, JsonSerializerOptions options)
    {
        throw new NotSupportedException();
    }
}

public enum SalaryTypeName
{
    AtLeast,
    AtMost,
    Exactly,
    Range
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