namespace JobHunt.Searching.Indeed;

public interface IIndeedJobFetcher
{
    Task<bool> JobSearchAsync(Search search, Func<IEnumerable<JobResult>, Task<bool>> processResults, CancellationToken token);

    Task AfterSearchCompleteAsync(IEnumerable<Job> jobs);
}