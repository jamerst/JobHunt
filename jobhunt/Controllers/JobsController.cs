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

        [HttpPatch]
        [Route("{id}")]
        public async Task Seen([FromRoute] int id)
        {
            await _jobService.MarkAsSeenAsync(id);
        }

        [HttpPatch]
        [Route("{id}")]
        public async Task Archive([FromRoute] int id, [FromQuery] bool toggle = false)
        {
            await _jobService.ArchiveAsync(id, toggle);
        }

        [HttpGet]
        public async Task<IActionResult> Counts()
        {
            return new JsonResult(await _jobService.GetJobCountsAsync(DateTimeOffset.UtcNow));
        }

        [HttpGet]
        public async Task<IActionResult> Categories()
        {
            var categories = await _jobService.GetJobCategoriesAsync();
            return new JsonResult(categories.Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name
            }));
        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> Status([FromRoute] int id, [FromBody] string status)
        {
            bool result = await _jobService.UpdateStatusAsync(id, status);

            if (!result)
            {
                return NotFound();
            }
            else
            {
                return Ok();
            }
        }
    }
}