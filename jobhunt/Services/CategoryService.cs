using Microsoft.EntityFrameworkCore;
namespace JobHunt.Services;
public class CategoryService : ICategoryService
{
    private readonly JobHuntContext _context;

    public CategoryService(JobHuntContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Category>> GetAllAsync()
    {
        return await _context.Categories.OrderBy(c => c.Name).ToListAsync();
    }
}

public interface ICategoryService
{
    Task<IEnumerable<Category>> GetAllAsync();
}