using System.Text.Json.Serialization;

namespace JobHunt.Searching.Indeed.GraphQL;

public class JobSearchVariables
{
    [JsonPropertyName("cursor")]
    public string? Cursor { get; set; }

    [JsonPropertyName("query")]
    public string? Query { get; set; }

    [JsonPropertyName("location")]
    public JobSearchLocationInput? Location { get; set; }

    [JsonPropertyName("limit")]
    public int Limit { get; set; }
}

public class JobSearchLocationInput
{
    [JsonPropertyName("where")]
    public required string Where { get; set; }
    [JsonPropertyName("radius")]
    public int Radius { get; set; }
    [JsonPropertyName("radiusUnit")]
    public required string RadiusUnit { get; set; }
}