using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Routing.Controllers;

namespace JobHunt.Controllers.OData;

public class CompanyCategoryController : ODataController
{
    private readonly ICompanyCategoryService _service;

    public CompanyCategoryController(ICompanyCategoryService service)
    {
        _service = service;
    }

    [HttpPost]
    public virtual async Task<IActionResult> Post([FromBody] CompanyCategory entity)
    {
        if (!ModelState.IsValid)
        {
            return UnprocessableEntity(ModelState);
        }

        return Created(await _service.CreateAsync(entity));
    }

    [HttpDelete]
    public virtual async Task<IActionResult> Delete(int keycategoryId, int keycompanyId)
    {
        bool? result = await _service.DeleteAsync(keycategoryId, keycompanyId);
        if (result.HasValue)
        {
            return Ok(result.Value);
        }
        else
        {
            return NotFound($"CompanyCategory with key {{{keycategoryId},{keycompanyId}}} not found");
        }
    }
}