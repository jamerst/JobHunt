namespace JobHunt.Searching;
public interface ISearchProvider
{
    Task SearchAllAsync(CancellationToken token);
    Task<bool> SearchAsync(Search searchParams, CancellationToken token);
}