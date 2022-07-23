using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Deltas;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Results;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using Microsoft.EntityFrameworkCore;

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
    [EnableQuery(MaxAnyAllExpressionDepth = 5)]
    public virtual IActionResult Get()
    {
        return Ok(_service.Set.AsNoTracking());
    }

    [HttpGet]
    [EnableQuery(MaxAnyAllExpressionDepth = 5)]
    public virtual SingleResult<T> Get(int key) // parameter must be named "key" otherwise it doesn't work
    {
        // returning a SingleResult allows features such as $expand to work
        // they don't work otherwise because calling FirstOrDefaultAsync triggers the DB call so .Include can't be called
        return SingleResult.Create(_service.Set.AsNoTracking().Where(x => x.Id == key));
    }

    [HttpPost]
    public virtual async Task<IActionResult> Post([FromBody] T entity)
    {
        if (!ModelState.IsValid)
        {
            return UnprocessableEntity(ModelState);
        }

        return Created(await _service.CreateAsync(entity));
    }

    [HttpPut]
    public virtual async Task<IActionResult> Put(int key, Delta<T> delta)
    {
        if (delta == null)
        {
            return BadRequest();
        }

        var result = await _service.PutAsync(key, delta);

        if (result == default)
        {
            return NotFound($"{nameof(T)} with Id={key} not found");
        }

        return await ValidateAndSave(result);
    }

    [HttpPatch]
    public virtual async Task<IActionResult> Patch(int key, Delta<T> delta)
    {
        if (delta == null)
        {
            return BadRequest();
        }

        var result = await _service.PatchAsync(key, delta);

        if (result == default)
        {
            return NotFound($"{nameof(T)} with Id={key} not found");
        }

        return await ValidateAndSave(result);
    }

    protected virtual async Task<IActionResult> ValidateAndSave(T entity)
    {
        var context = new ValidationContext(entity);
        var results = new List<ValidationResult>();

        if (Validator.TryValidateObject(entity, context, results))
        {
            await _service.SaveChangesAsync();

            return Updated(entity);
        }
        else
        {
            return UnprocessableEntity(results);
        }
    }

    [HttpDelete]
    public virtual async Task<IActionResult> Delete(int key)
    {
        if (await _service.DeleteAsync(key))
        {
            return Ok();
        }
        else
        {
            return NotFound($"{nameof(T)} with Id={key} not found");
        }
    }
}