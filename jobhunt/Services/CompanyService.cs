using Microsoft.EntityFrameworkCore;

using JobHunt.Geocoding;
using JobHunt.PageWatcher;
using JobHunt.Services.BaseServices;

namespace JobHunt.Services;
public class CompanyService : ODataBaseService<Company>, ICompanyService
{
    private readonly IGeocoder _geocoder;
    private readonly IPageWatcher _pageWatcher;

    public CompanyService(JobHuntContext context, IGeocoder geocoder, IPageWatcher pageWatcher) : base(context)
    {
        _geocoder = geocoder;
        _pageWatcher = pageWatcher;
    }

    public async Task<Company?> FindByNameAsync(string name)
    {
        return await _context.Companies
            .Include(c => c.AlternateNames)
            .FirstOrDefaultAsync(c => c.Name == name || c.AlternateNames.Any(an => an.Name == name));
    }

    public async Task CreateAllAsync(IEnumerable<Company> companies)
    {
        _context.Companies.AddRange(companies);

        await _context.SaveChangesAsync();
    }

    public IAsyncEnumerable<Category> GetCompanyCategories()
    {
        return _context.Categories
            .Where(c => c.CompanyCategories.Any())
            .AsAsyncEnumerable();
    }

    public async Task<bool> MergeAsync(int srcId, int destId)
    {
        Company? src = await _context.Companies
            .SingleOrDefaultAsync(c => c.Id == srcId);
        Company? dest = await _context.Companies
            .Include(c => c.AlternateNames)
            .Include(c => c.CompanyCategories)
            .SingleOrDefaultAsync(c => c.Id == destId);

        if (src == default || dest == default)
        {
            return false;
        }

        using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            await _context.Jobs
                .Where(j => j.CompanyId == srcId)
                .ExecuteUpdateAsync(s => s.SetProperty(j => j.CompanyId, destId));
            await _context.Jobs
                .Where(j => j.ActualCompanyId == srcId)
                .ExecuteUpdateAsync(s => s.SetProperty(j => j.ActualCompanyId, destId));

            // only update CompanyNames where the same name doesn't already exist on the destination
            // any remaining CompanyNames will simply be deleted
            var destNames = dest.AlternateNames.Select(n => n.Name);
            await _context.CompanyNames
                .Where(n => n.CompanyId == srcId && !destNames.Contains(n.Name))
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.CompanyId, destId));

            var destCategories = dest.CompanyCategories.Select(c => c.CategoryId);
            await _context.CompanyCategories
                .Where(c => c.CompanyId == srcId)
                .ExecuteUpdateAsync(s => s.SetProperty(c => c.CompanyId, destId));

            await _context.WatchedPages
                .Where(p => p.CompanyId == srcId)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.CompanyId, destId));

            await transaction.CommitAsync();
        }

        if (src.Recruiter && !dest.Recruiter)
        {
            dest.Recruiter = true;
        }

        _context.Companies.Remove(src);

        await _context.SaveChangesAsync();

        return true;
    }
}

public interface ICompanyService : IODataBaseService<Company>
{
    Task<Company?> FindByNameAsync(string name);
    Task CreateAllAsync(IEnumerable<Company> companies);
    IAsyncEnumerable<Category> GetCompanyCategories();
    Task<bool> MergeAsync(int srcId, int destId);
}