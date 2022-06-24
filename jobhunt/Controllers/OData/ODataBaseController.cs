using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Formatter;
using Microsoft.AspNetCore.OData.Deltas;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;

using JobHunt.Services.BaseServices;

namespace JobHunt.Controllers.OData;

public abstract class ODataBaseController<T> : ODataController where T : class, KeyedEntity
{
    private readonly IODataBaseService<T> _service;

    public ODataBaseController(IODataBaseService<T> service)
    {
        _service = service;
    }

    [HttpGet]
    [EnableQuery]
    public IActionResult Get()
    {
        return Ok(_service.Set);
    }

    // [HttpGet]
    // [EnableQuery]
    // public async Task<IActionResult> Get([FromODataUri]int id)
    // {
    //     var entity = await _service.FindByIdAsync(id);
    //     if (entity == default)
    //     {
    //         return NotFound($"");
    //     }

    //     return Ok(entity);
    // }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody]T entity)
    {
        _service.Set.Add(entity);

        await _service.SaveChangesAsync();

        return Created(entity);
    }

    [HttpPut]
    public async Task<IActionResult> Put(int id, [FromBody]Delta<T> delta)
    {
        var result = await _service.PutAsync(id, delta);

        if (result == default)
        {
            return NotFound($"{nameof(T)} with Id={id} not found");
        }

        return Updated(result);
    }

    [HttpPatch]
    public async Task<IActionResult> Patch(int id, [FromBody]Delta<T> delta)
    {
        var result = await _service.PatchAsync(id, delta);

        if (result == default)
        {
            return NotFound($"{nameof(T)} with Id={id} not found");
        }

        return Updated(result);
    }

    [HttpDelete]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _service.FindByIdAsync(id);

        if (entity == default)
        {
            return NotFound($"{nameof(T)} with Id={id} not found");
        }

        _service.Set.Remove(entity);
        await _service.SaveChangesAsync();

        return Ok();
    }
}