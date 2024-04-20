using Microsoft.AspNetCore.Mvc;

namespace JobHunt.Controllers.OData;

public class JobController : ODataBaseController<Job>
{
    private IJobService _service;
    private ILogger _logger;

    public JobController(IJobService service, ILogger<JobController> logger) : base(service)
    {
        _service = service;
        _logger = logger;
    }

    [HttpDelete]
    public async Task<IActionResult> Delete(int key, bool? deleteDuplicates = null)
    {
        if (await _service.DeleteAsync(key, deleteDuplicates))
        {
            return Ok();
        }
        else
        {
            return NotFound($"{nameof(Job)} with Id={key} not found");
        }
    }
}