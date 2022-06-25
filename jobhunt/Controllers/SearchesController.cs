using Microsoft.AspNetCore.Mvc;

namespace JobHunt.Controllers;
[ApiController]
[Route("api/[controller]/[action]")]
public class SearchesController : ControllerBase
{
    private readonly ISearchService _searchService;
    public SearchesController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    [HttpGet]
    [Route("~/api/searches/{id}")]
    public async Task<IActionResult> Get([FromRoute] int id)
    {
        var result = await _searchService.GetByIdAsync(id);
        if (result == default(Search))
        {
            return NotFound();
        }
        else
        {
            return new JsonResult(new
            {
                result.Id,
                result.Provider,
                result.Query,
                result.Country,
                result.Location,
                result.Distance,
                result.MaxAge,
                result.Enabled,
                result.EmployerOnly,
                result.JobType,
                result.LastRun,
                Runs = result.Runs.Select(sr => new
                {
                    sr.Id,
                    sr.Time,
                    sr.Success,
                    sr.Message,
                    sr.NewJobs,
                    sr.NewCompanies,
                    sr.TimeTaken
                }),
                Description = result.ToString()
            });
        }
    }

    [HttpGet("~/api/searches")]
    public async Task<IActionResult> GetAll([FromQuery] int page, [FromQuery] int size, [FromQuery] bool count = false)
    {
        (var results, int? total) = await _searchService.GetPagedAsync(page, size, count);
        return new JsonResult(new
        {
            total = total,
            results = results.Select(j => new
            {
                Id = j.Id,
                Enabled = j.Enabled,
                Description = j.ToString(),
                LastRun = j.LastRun,
                LastRunSuccess = j.LastFetchSuccess
            })
        });
    }

    [HttpPatch]
    [Route("~/api/searches/{id}")]
    public async Task<IActionResult> Update([FromRoute] int id, [FromBody] SearchDto details)
    {
        (bool result, string msg) = await _searchService.UpdateAsync(details);

        if (result)
        {
            return Ok();
        }
        else
        {
            return BadRequest(msg);
        }
    }

    [HttpDelete]
    [Route("~/api/searches/{id}")]
    public async Task<IActionResult> Delete([FromRoute] int id)
    {
        if (await _searchService.RemoveAsync(id))
        {
            return Ok();
        }
        else
        {
            return NotFound();
        }
    }

    [HttpPatch("{id}")]
    public async Task Enable([FromRoute] int id)
    {
        await _searchService.ToggleEnabledAsync(id);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SearchDto details)
    {
        (int? id, string msg) = await _searchService.CreateAsync(details);

        if (id.HasValue)
        {
            return new JsonResult(id);
        }
        else
        {
            return BadRequest(msg);
        }
    }
}