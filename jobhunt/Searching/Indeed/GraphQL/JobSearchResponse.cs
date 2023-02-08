using System.Text.Json.Serialization;

namespace JobHunt.Searching.Indeed.GraphQL;

public class JobSearchResponse
{
    public required JobSearch JobSearch { get; set; }
}

public class JobSearch
{
    public required List<JobSearchResult> Results { get; set; }
    public required JobSearchPageInfo PageInfo { get; set; }
}

public class JobSearchResult
{
    public required IndeedJob Job { get; set; }

    public JobResult ToJobResult(SearchOptions options) =>
        new JobResult
        {
            Key = Job.Key,
            Title = Job.Title,
            Url = $"https://{options.Indeed.HostName}/viewjob?jk={Job.Key}",
            HtmlDescription = Job.Description?.Html,
            Location = Job.Location.Formatted.Long,
            Latitude = Job.Location.Latitude,
            Longitude = Job.Location.Longitude,
            EmployerName = Job.Employer?.Name ?? Job.SourceEmployerName,
            Posted = Job.DateOnIndeed,
            Attributes = Job.Attributes.Select(a => a.Label),
            FormattedSalary = Job.Compensation?.GetFormattedText(),
            AvgYearlySalary = Job.Compensation?.GetAvgYearlySalary()
        };
}

public class IndeedJob
{
    public required string Key { get; set; }
    public required string Title { get; set; }
    public JobDescription? Description { get; set; }
    public required JobLocation Location { get; set; }
    public required string SourceEmployerName { get; set; }
    public Employer? Employer { get; set; }
    [JsonConverter(typeof(UnixEpochDateTimeOffsetConverter))]
    public DateTimeOffset DateOnIndeed { get; set; }
    public required List<JobAttribute> Attributes { get; set; }
    public JobCompensation? Compensation { get; set; }
}

public class JobSearchPageInfo
{
    public string? NextCursor { get; set; }
}
