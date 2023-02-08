namespace JobHunt.Searching.Indeed;

public interface IIndeedJobFetcher
{
    Task<bool> JobSearchAsync(Search search, Func<IEnumerable<JobResult>, Task<bool>> processResults, CancellationToken token);

    Task<bool> AfterSearchCompleteAsync(Search search, IEnumerable<JobResult> jobs, CancellationToken token);
}