using Microsoft.EntityFrameworkCore;

namespace JobHunt.Services.BaseServices;

public class KeyedEntityBaseService<T> : BaseService<T>, IKeyedEntityBaseService<T>
    where T : class, KeyedEntity
{
    public KeyedEntityBaseService(JobHuntContext context) : base(context) { }

    public async Task<T?> FindByIdAsync(int id)
    {
        return await _context.Set<T>().FirstOrDefaultAsync(x => x.Id == id);
    }
}

public interface IKeyedEntityBaseService<T> : IBaseService<T> where T : class, KeyedEntity
{
    Task<T?> FindByIdAsync(int id);
}