using Refit;

namespace JobHunt.Searching.Indeed;

public interface IIndeedJobDescriptionApi
{
    [Get("/rpc/jobdescs")]
    Task<Dictionary<string, string>> GetJobDescriptionsAsync([AliasAs("jks")][Query(CollectionFormat.Csv)] IEnumerable<string> jobKeys);
}