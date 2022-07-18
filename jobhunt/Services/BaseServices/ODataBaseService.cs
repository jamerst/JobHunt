using Microsoft.AspNetCore.OData.Deltas;

namespace JobHunt.Services.BaseServices;

public class ODataBaseService<T> : KeyedEntityBaseService<T>, IODataBaseService<T> where T : class, KeyedEntity
{
    public ODataBaseService(JobHuntContext context) : base(context) { }

    public virtual async Task<T?> PutAsync(int id, Delta<T> delta)
    {
        var entity = await FindByIdAsync(id);
        if (entity == default)
        {
            return default;
        }

        delta.Put(entity);

        await BeforeSaveAsync(entity);

        await SaveChangesAsync();

        return entity;
    }

    public virtual async Task<T?> PatchAsync(int id, Delta<T> delta)
    {
        var entity = await FindByIdAsync(id);
        if (entity == default)
        {
            return default;
        }

        delta.Patch(entity);

        await BeforeSaveAsync(entity);

        await SaveChangesAsync();

        return entity;
    }
}

public interface IODataBaseService<T> : IKeyedEntityBaseService<T> where T : class, KeyedEntity
{
    Task<T?> PutAsync(int id, Delta<T> delta);
    Task<T?> PatchAsync(int id, Delta<T> delta);
}