using System.Net;

using Microsoft.AspNetCore.Mvc;

using JobHunt.Searching.Indeed;

namespace JobHunt.Controllers;
[ApiController]
[Route("api/[controller]/[action]")]
public class SearchesController : ControllerBase
{
    private readonly ISearchService _searchService;
    private readonly IJobService _jobService;
    private readonly IIndeedApiSearchProvider _indeed;
    public SearchesController(ISearchService searchService, IJobService jobService, IIndeedApiSearchProvider indeed)
    {
        _searchService = searchService;
        _jobService = jobService;
        _indeed = indeed;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Refresh([FromRoute] int id, CancellationToken token)
    {
        Search? search = await _searchService.FindByIdAsync(id);
        if (search != default)
        {
            bool success = await _indeed.SearchAsync(search, token);
            if (success)
            {
                await _jobService.CheckForDuplicatesAsync(false, token);
                return Ok();
            }
            else
            {
                return StatusCode((int) HttpStatusCode.InternalServerError);
            }
        }
        else
        {
            return NotFound();
        }
    }
}