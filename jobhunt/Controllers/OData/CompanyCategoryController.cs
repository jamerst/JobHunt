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
        if (await _service.DeleteAsync(keycategoryId, keycompanyId))
        {
            return Ok();
        }
        else
        {
            return NotFound($"CompanyCategory with key {{{keycategoryId},{keycompanyId}}} not found");
        }
    }
}