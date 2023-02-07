namespace JobHunt.Searching.Indeed.GraphQL;

public class JobDataResponse
{
    public required JobDataResults JobData { get; set; }
}

public class JobDataResults
{
    public required List<JobDataResultWrapper> Results { get; set; }
}

public class JobDataResultWrapper
{
    public required JobDataResult Job { get; set; }
}

public class JobDataResult
{
    public JobCompensation? Compensation { get; set; }
    public required string Key { get; set; }
    public JobDescription? Description { get; set; }
    public required List<JobAttribute> Attributes { get; set; }
}
