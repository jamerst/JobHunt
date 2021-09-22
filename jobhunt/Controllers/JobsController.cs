using System;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Attributes;

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

        [EnableQuery]
        [ODataAttributeRouting]
        public IActionResult Query() {
            return Ok(_jobService.GetSet());
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
                    seen = job.Seen,
                    Latitude = job.Latitude,
                    Longitude = job.Longitude
                });
            }
        }

        [HttpPatch]
        [Route("~/api/jobs/{id}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] JobDto details) {
             if (await _jobService.UpdateAsync(id, details)) {
                 return Ok();
             } else {
                 return NotFound();
             }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] NewJobDto details) {
            int? result = await _jobService.CreateAsync(details);

            if (result.HasValue) {
                return new JsonResult(result.Value);
            } else {
                return BadRequest();
            }
        }

        [HttpPatch]
        [Route("{id}")]
        public async Task Seen([FromRoute] int id) {
            await _jobService.MarkAsSeenAsync(id);
        }

        [HttpPatch]
        [Route("{id}")]
        public async Task Archive([FromRoute] int id, [FromQuery] bool toggle = false) {
            await _jobService.MarkAsArchivedAsync(id, toggle);
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
        public async Task<IActionResult> Latest([FromQuery] int page, [FromQuery] int size, [FromQuery] bool count = false) {
            (var results, int? total) = await _jobService.GetLatestPagedAsync(page, size, count);
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

        [HttpGet]
        public async Task<IActionResult> Search([FromQuery] Filter filter, [FromQuery] int page, [FromQuery] int size, [FromQuery] bool count = false) {
            (var results, int? total) = await _jobService.SearchPagedAsync(filter, page, size, count);

            return new JsonResult(new {
                total = total,
                results = results
            });
        }

        [HttpGet]
        public async Task<IActionResult> Categories() {
            var categories = await _jobService.GetJobCategoriesAsync();
            return new JsonResult(categories.Select(c => new CategoryDto {
                Id = c.Id,
                Name = c.Name
            }));
        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> Status([FromRoute]int id, [FromBody]string status) {
            bool result = await _jobService.UpdateStatusAsync(id, status);

            if (!result) {
                return NotFound();
            } else {
                return Ok();
            }
        }
    }
}