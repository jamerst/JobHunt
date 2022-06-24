namespace JobHunt.Searching;
public interface ISearchProvider
{
    Task SearchAllAsync(CancellationToken token);
    Task SearchAsync(Search searchParams, CancellationToken token);
}