using Refit;

namespace JobHunt.Searching.Indeed.Publisher;

public interface IIndeedJobDescriptionApi
{
    [Get("/rpc/jobdescs")]
    Task<ApiResponse<Dictionary<string, string>>> GetJobDescriptionsAsync([AliasAs("jks")][Query(CollectionFormat.Csv)] IEnumerable<string> jobKeys);
}