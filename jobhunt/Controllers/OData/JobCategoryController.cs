using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Routing.Controllers;

namespace JobHunt.Controllers.OData;

public class JobCategoryController : ODataController
{
    private readonly IJobCategoryService _service;

    public JobCategoryController(IJobCategoryService service)
    {
        _service = service;
    }

    [HttpPost]
    public virtual async Task<IActionResult> Post([FromBody] JobCategory entity)
    {
        if (!ModelState.IsValid)
        {
            return UnprocessableEntity(ModelState);
        }

        return Created(await _service.CreateAsync(entity));
    }

    [HttpDelete]
    public virtual async Task<IActionResult> Delete(int keycategoryId, int keyjobId)
    {
        bool? result = await _service.DeleteAsync(keycategoryId, keyjobId);
        if (result.HasValue)
        {
            return Ok(result.Value);
        }
        else
        {
            return NotFound($"JobCategory with key {{{keycategoryId},{keyjobId}}} not found");
        }
    }
}