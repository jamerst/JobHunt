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

    public virtual async Task<T> CreateAsync(T entity)
    {
        Set.Add(entity);

        await BeforeSaveAsync(entity);

        await SaveChangesAsync();

        return entity;
    }

    public virtual Task<T> BeforeSaveAsync(T entity)
    {
        return Task.FromResult(entity);
    }
}

public interface IBaseService<T> where T : class, KeyedEntity
{
    DbSet<T> Set { get; }
    Task<int> SaveChangesAsync();
    Task<T> CreateAsync(T entity);
    Task<T> BeforeSaveAsync(T entity);
}