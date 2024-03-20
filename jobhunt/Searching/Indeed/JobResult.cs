namespace JobHunt.Searching.Indeed;

public class JobResult
{
    public required string Key { get; set; }
    public required string Title { get; set; }
    public required string Url { get; set; }
    public string? HtmlDescription { get; set; }
    public bool Remote { get; set; }
    public required string Location { get; set;}
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public required string EmployerName { get; set; }
    public string? AlternativeEmployerName { get; set; }
    public DateTimeOffset Posted { get; set; }
    public required IEnumerable<string> Attributes { get; set; }
    public string? FormattedSalary { get; set; }
    public int? AvgYearlySalary { get; set; }
}