using Microsoft.AspNetCore.Mvc;

namespace JobHunt.Controllers
{
    [ApiController]
    [Route("api/[controller]/[action]")]
    public class JobsController : ControllerBase
    {
        private readonly IJobService _jobService;
        public JobsController(IJobService jobService)
        {
            _jobService = jobService;
        }

        [HttpGet]
        public async Task<IActionResult> Counts()
        {
            return new JsonResult(await _jobService.GetJobCountsAsync(DateTimeOffset.UtcNow));
        }

        [HttpGet]
        public IActionResult Categories()
        {
            return Ok(_jobService.GetJobCategories());
        }
    }
}