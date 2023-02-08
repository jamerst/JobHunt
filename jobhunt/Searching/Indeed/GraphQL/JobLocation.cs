namespace JobHunt.Searching.Indeed.GraphQL;

public class JobLocation
{
    public required FormattedJobLocation Formatted { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class FormattedJobLocation
{
    public required string Long { get; set; }
}