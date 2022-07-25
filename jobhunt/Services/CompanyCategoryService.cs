using Microsoft.EntityFrameworkCore;

namespace JobHunt.Services;

public class CompanyCategoryService : ICompanyCategoryService {
    private readonly JobHuntContext _context;

    public CompanyCategoryService(JobHuntContext context)
    {
        _context = context;
    }

    public async Task<CompanyCategory> CreateAsync(CompanyCategory entity)
    {
        _context.Add(entity);

        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task<bool?> DeleteAsync(int categoryId, int companyId)
    {
        CompanyCategory? entity = await _context.CompanyCategories
            .FirstOrDefaultAsync(c => c.CategoryId == categoryId && c.CompanyId == companyId);

        if (entity == default)
        {
            return null;
        }

        bool deletedCategory = false;
        if (!_context.CompanyCategories.Any(cc => cc.CategoryId == categoryId && cc.CompanyId == companyId)
            && !_context.JobCategories.Any(jc => jc.CategoryId == categoryId))
        {
            Category? category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == categoryId);
            if (category != default)
            {
                deletedCategory = true;
                _context.Categories.Remove(category);
            }
        }

        _context.CompanyCategories.Remove(entity);

        await _context.SaveChangesAsync();

        return deletedCategory;
    }
}

public interface ICompanyCategoryService
{
    Task<CompanyCategory> CreateAsync(CompanyCategory entity);
    Task<bool?> DeleteAsync(int categoryId, int companyId);
}