using Microsoft.EntityFrameworkCore;

namespace JobHunt.Services;

public class JobCategoryService : IJobCategoryService {
    private readonly JobHuntContext _context;

    public JobCategoryService(JobHuntContext context)
    {
        _context = context;
    }

    public async Task<JobCategory> CreateAsync(JobCategory entity)
    {
        _context.Add(entity);

        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task<bool?> DeleteAsync(int categoryId, int jobId)
    {
        JobCategory? entity = await _context.JobCategories
            .FirstOrDefaultAsync(c => c.CategoryId == categoryId && c.JobId == jobId);

        if (entity == default)
        {
            return null;
        }

        bool deletedCategory = false;
        if (!_context.JobCategories.Any(jc => jc.CategoryId == categoryId && jc.JobId != jobId)
            && !_context.CompanyCategories.Any(cc => cc.CategoryId == categoryId))
        {
            Category? category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == categoryId);
            if (category != default)
            {
                deletedCategory = true;
                _context.Categories.Remove(category);
            }
        }

        _context.JobCategories.Remove(entity);

        await _context.SaveChangesAsync();

        return deletedCategory;
    }
}

public interface IJobCategoryService
{
    Task<JobCategory> CreateAsync(JobCategory entity);
    Task<bool?> DeleteAsync(int categoryId, int jobId);
}