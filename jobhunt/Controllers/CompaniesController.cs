using Microsoft.AspNetCore.Mvc;

namespace JobHunt.Controllers;
[ApiController]
[Route("api/[controller]/[action]")]
public class CompaniesController : ControllerBase
{
    private readonly ICompanyService _companyService;

    public CompaniesController(ICompanyService companyService)
    {
        _companyService = companyService;
    }

    [HttpGet]
    public IActionResult Categories()
    {
        return Ok(_companyService.GetCompanyCategories());
    }

    [HttpPatch]
    [Route("{id}")]
    public async Task<IActionResult> Merge([FromRoute] int id, [FromBody] int dest)
    {
        bool result = await _companyService.MergeAsync(id, dest);

        if (result)
        {
            return Ok();
        }
        else
        {
            return NotFound();
        }
    }
}