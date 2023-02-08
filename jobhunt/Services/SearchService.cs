using Microsoft.EntityFrameworkCore;

using JobHunt.Services.BaseServices;

namespace JobHunt.Services;
public class SearchService : ODataBaseService<Search>, ISearchService
{
    public SearchService(JobHuntContext context) : base(context) { }

    public async Task<Search?> GetByIdAsync(int id)
    {
        return await _context.Searches
            .AsNoTracking()
            .Include(s => s.Runs.OrderByDescending(sr => sr.Time).Take(10))
            .SingleOrDefaultAsync(s => s.Id == id);
    }

    public async Task<IEnumerable<Search>> FindEnabledByProviderAsync(string provider)
    {
        return await _context.Searches.Where(s => s.Provider == provider && s.Enabled).ToListAsync();
    }

    public async Task<SearchRun> CreateSearchRunAsync(int searchId, bool success, string? message, int newJobs, int newCompanies, int timeTaken)
    {
        Search search = await _context.Searches.SingleAsync(s => s.Id == searchId);
        search.LastResultCount = newJobs;
        search.LastFetchSuccess = success;
        search.LastRun = DateTimeOffset.UtcNow;

        SearchRun run = new SearchRun
        {
            Search = null!,
            SearchId = searchId,
            Time = DateTimeOffset.UtcNow,
            Success = success,
            Message = message,
            NewJobs = newJobs,
            NewCompanies = newCompanies,
            TimeTaken = timeTaken
        };

        _context.SearchRuns.Add(run);

        await _context.SaveChangesAsync();

        return run;
    }
}

public interface ISearchService : IODataBaseService<Search>
{
    Task<IEnumerable<Search>> FindEnabledByProviderAsync(string provider);
    Task<SearchRun> CreateSearchRunAsync(int searchId, bool success, string? message, int newJobs, int newCompanies, int timeTaken);
}