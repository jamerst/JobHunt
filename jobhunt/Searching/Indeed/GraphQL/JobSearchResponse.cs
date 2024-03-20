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

    public JobResult ToJobResult(SearchOptions options)
    {
        var result = new JobResult
        {
            Key = Job.Key,
            Title = Job.Title,
            Url = $"https://{options.Indeed.HostName}/viewjob?jk={Job.Key}",
            HtmlDescription = Job.Description?.Html,
            Location = Job.Location.Formatted.Long,
            EmployerName = Job.SourceEmployerName,
            Posted = Job.DateOnIndeed,
            Attributes = Job.Attributes.Select(a => a.Label),
            FormattedSalary = Job.Compensation?.GetFormattedText(),
            AvgYearlySalary = Job.Compensation?.GetAvgYearlySalary()
        };

        if (result.Location.ToLower() == "remote"
            || (Job.Location.Latitude == 25 && Job.Location.Longitude == -40)) // Indeed uses those coords for remote jobs for some reason
        {
            result.Remote = true;
        }
        else
        {
            result.Latitude = Job.Location.Latitude;
            result.Longitude = Job.Location.Longitude;
        }

        if (!string.IsNullOrEmpty(Job.Employer?.Name) && Job.Employer.Name.ToLower() != result.EmployerName.ToLower())
        {
            result.AlternativeEmployerName = Job.Employer.Name;
        }

        return result;
    }
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
