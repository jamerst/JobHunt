using System;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Mvc;

using JobHunt.DTO;
using JobHunt.Models;
using JobHunt.Services;

namespace JobHunt.Controllers {
    [ApiController]
    [Route("api/[controller]/[action]")]
    public class JobsController : ControllerBase {
        private readonly IJobService _jobService;
        public JobsController(IJobService jobService) {
            _jobService = jobService;
        }

        [HttpGet]
        [Route("~/api/jobs/{id}")]
        public async Task<IActionResult> Get([FromRoute] int id) {
            Job job = await _jobService.GetByIdAsync(id);

            if (job == default(Job)) {
                return NotFound();
            } else {
                return new JsonResult(new {
                    Id = job.Id,
                    Title = job.Title,
                    Description = job.Description,
                    Salary = job.Salary,
                    Location = job.Location,
                    Url = job.Url,
                    CompanyId = job.CompanyId,
                    CompanyName = job.Company?.Name,
                    Posted = job.Posted,
                    Notes = job.Notes,
                    Archived = job.Archived,
                    Status = job.Status,
                    DateApplied = job.DateApplied,
                    Categories = job.JobCategories.Select(jc => new {
                        Id = jc.CategoryId,
                        Name = jc.Category.Name
                    }),
                    Provider = job.Provider,
                    SourceId = job.SourceId,
                    SourceName = job.Source?.ToString(),
                    seen = job.Seen
                });
            }
        }

        [HttpPatch]
        [Route("~/api/jobs/{id}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] JobDto details) {
            Job? result = await _jobService.UpdateAsync(id, details);

            if (result == null) {
                return NotFound();
            } else {
                return Ok();
            }
        }

        [HttpPatch]
        [Route("{id}")]
        public async Task Seen([FromRoute] int id) {
            await _jobService.MarkAsSeenAsync(id);
        }

        [HttpPatch]
        [Route("{id}")]
        public async Task<IActionResult> Categories([FromRoute] int id, [FromBody] CategoryDto[] categories) {
            var result = await _jobService.UpdateCategoriesAsync(id, categories);

            if (result != null) {
                return new JsonResult(result.Select(c => new CategoryDto {
                    Id = c.Id,
                    Name = c.Name
                }));
            } else {
                return BadRequest();
            }
        }

        [HttpGet]
        public async Task<IActionResult> Latest([FromQuery] int page, [FromQuery] int size) {
            (var results, int total) = await _jobService.GetLatestPagedAsync(page, size);
            return new JsonResult(new {
                total = total,
                results = results.Select(j => new {
                    Id = j.Id,
                    Title = j.Title,
                    Location = j.Location,
                    CompanyId = j.CompanyId,
                    CompanyName = j.Company?.Name,
                    Posted = j.Posted,
                    Seen = j.Seen
                })
            });
        }

        [HttpGet]
        public async Task<IActionResult> Counts() {
            return new JsonResult(await _jobService.GetJobCountsAsync(DateTime.Now));
        }
    }
}