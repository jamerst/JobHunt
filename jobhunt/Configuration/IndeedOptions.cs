namespace JobHunt.Configuration;

public class IndeedOptions
{
    public bool UseGraphQL { get; set; }
    public string? GraphQLApiKey { get; set; }
    public string SearchRadiusUnit { get; set; } = "MILES";
    public string? HostName { get; set; }
    public bool CanUseGraphQL() => !string.IsNullOrEmpty(GraphQLApiKey);

    public string? PublisherId { get; set; }
    public bool FetchSalary { get; set; }
    public bool UseGraphQLSalaryAndDescriptions { get; set; }
    public bool CanUsePublisher() => !string.IsNullOrEmpty(PublisherId);
}