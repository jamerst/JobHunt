using System.Text.Json.Serialization;

namespace JobHunt.Searching.Indeed.GraphQL;

public class JobSearchVariables
{
    public string? Cursor { get; set; }
    public string? Query { get; set; }
    public JobSearchLocationInput? Location { get; set; }
    public List<JobSearchFilterInput> Filters { get; set; } = new List<JobSearchFilterInput>();
    public int Limit { get; set; }
}

public class JobSearchLocationInput
{
    public required string Where { get; set; }
    public int Radius { get; set; }
    public required string RadiusUnit { get; set; }
}

public class JobSearchFilterInput
{
    public JobSearchDateRangeFilterInput? Date { get; set; }
}

public class JobSearchDateRangeFilterInput
{
    public required string Field { get; set; }
    public string? Start { get; set; }
    public string? End { get; set; }
}