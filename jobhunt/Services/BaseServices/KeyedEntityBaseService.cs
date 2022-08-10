using Microsoft.EntityFrameworkCore;

namespace JobHunt.Services.BaseServices;

public class KeyedEntityBaseService<T> : BaseService<T>, IKeyedEntityBaseService<T>
    where T : class, KeyedEntity
{
    public KeyedEntityBaseService(JobHuntContext context) : base(context) { }

    public virtual async Task<T?> FindByIdAsync(int id)
    {
        return await _context.Set<T>().FirstOrDefaultAsync(x => x.Id == id);
    }

    public virtual async Task<bool> DeleteAsync(int id)
    {
        var entity = await FindByIdAsync(id);
        if (entity == default)
        {
            return false;
        }

        Set.Remove(entity);
        await SaveChangesAsync();

        return true;
    }
}

public interface IKeyedEntityBaseService<T> : IBaseService<T> where T : class, KeyedEntity
{
    Task<T?> FindByIdAsync(int id);
    Task<bool> DeleteAsync(int id);
}