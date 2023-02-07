using JobHunt.Searching.Indeed;

namespace JobHunt.Searching.Indeed.Publisher;

public class IndeedPublisherService : IIndeedJobFetcher
{
    public Task AfterSearchCompleteAsync(IEnumerable<Job> jobs)
    {
        throw new NotImplementedException();
    }

    public Task<bool> JobSearchAsync(Search search, Func<IEnumerable<Indeed.JobResult>, Task<bool>> processResults, CancellationToken token)
    {
        throw new NotImplementedException();
    }
}