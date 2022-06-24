using Microsoft.EntityFrameworkCore;

namespace JobHunt.Services.BaseServices;
public class BaseService<T> : IBaseService<T> where T : class, KeyedEntity
{
    protected readonly JobHuntContext _context;

    public BaseService(JobHuntContext context)
    {
        _context = context;
    }

    public DbSet<T> Set => _context.Set<T>();

    public Task<int> SaveChangesAsync() => _context.SaveChangesAsync();
}

public interface IBaseService<T> where T : class, KeyedEntity
{
    DbSet<T> Set { get; }
    Task<int> SaveChangesAsync();
}