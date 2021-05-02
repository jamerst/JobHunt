using System;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Mvc;

using JobHunt.DTO;
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
        public async Task<IActionResult> Latest([FromQuery] int page, [FromQuery] int size) {
            (var results, int total) = await _jobService.GetLatestPagedAsync(page, size);
            return new JsonResult(new {
                total = total,
                results = results.Select(j => new {
                    Id = j.Id,
                    Title = j.Title,
                    Salary = j.Salary,
                    Location = j.Location, 
                    CompanyId = j.CompanyId,
                    CompanyName = j.Company?.Name,
                    Posted = j.Posted,
                    Categories = j.JobCategories.Select(jc => new CategoryDto {
                        Id = jc.CategoryId,
                        Name = jc.Category.Name
                    })
                })
            });
        }

        [HttpGet]
        public async Task<IActionResult> Counts() {
            return new JsonResult(await _jobService.GetJobCountsAsync(DateTime.Now));
        }
    }
}