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
    public class CompaniesController : ControllerBase {
        private readonly ICompanyService _companyService;
        private readonly IJobService _jobService;
        public CompaniesController(ICompanyService companyService, IJobService jobService) {
            _companyService = companyService;
            _jobService = jobService;
        }

        [HttpGet]
        [Route("~/api/companies/{id}")]
        public async Task<IActionResult> Get([FromRoute] int id) {
            Company company = await _companyService.GetByIdAsync(id);

            if (company == default(Company)) {
                return NotFound();
            } else {
                return new JsonResult(new {
                    Id = company.Id,
                    Name = company.Name,
                    Location = company.Location,
                    Notes = company.Notes,
                    Watched = company.Watched,
                    Blacklisted = company.Blacklisted,
                    Website = company.Website,
                    Rating = company.Rating,
                    Glassdoor = company.Glassdoor,
                    LinkedIn = company.LinkedIn,
                    Endole = company.Endole,
                    WatchedPages = company.WatchedPages.Select(wp => new {
                        Url = wp.Url,
                        CssSelector = wp.CssSelector,
                        CssBlacklist = wp.CssBlacklist,
                        LastScraped = wp.LastScraped,
                        LastUpdated = wp.LastUpdated,
                        StatusMessage = wp.StatusMessage,
                        Enabled = wp.Enabled
                    }),
                    Categories = company.CompanyCategories.Select(cc => new {
                        Id = cc.CategoryId,
                        Name = cc.Category.Name
                    }).OrderBy(c => c.Name),
                    AlternateNames = company.AlternateNames.Select(n => n.Name),
                    Latitude = company.Latitude,
                    Longitude = company.Longitude
                });
            }
        }

        [HttpGet]
        [Route("~/api/companies/{id}/jobs")]
        public async Task<IActionResult> GetJobs([FromRoute] int id, [FromQuery] int page, [FromQuery] int size, [FromQuery] bool count = false) {
            (var results, int? total) = await _jobService.GetLatestPagedByCompanyAsync(id, page, size, count);
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

        [HttpPatch]
        [Route("~/api/companies/{id}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] CompanyDto details) {
            Company? result = await _companyService.UpdateAsync(id, details);

            if (result == null) {
                return NotFound();
            } else {
                return Ok();
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CompanyDto details) {
            int? result = await _companyService.CreateAsync(details);

            if (result.HasValue) {
                return new JsonResult(result.Value);
            } else {
                return BadRequest();
            }
        }

        [HttpPatch]
        [Route("{id}")]
        public async Task<IActionResult> Categories([FromRoute] int id, [FromBody] CategoryDto[] categories) {
            var result = await _companyService.UpdateCategoriesAsync(id, categories);

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
        public async Task<IActionResult> Search([FromQuery] Filter filter, [FromQuery] int page, [FromQuery] int size, [FromQuery] bool count = false) {
            (var results, int? total) = await _companyService.SearchPagedAsync(filter, page, size, count);

            return new JsonResult(new {
                total = total,
                results = results
            });
        }

        [HttpGet]
        public async Task<IActionResult> Categories() {
            var categories = await _companyService.GetCompanyCategoriesAsync();
            return new JsonResult(categories.Select(c => new CategoryDto {
                Id = c.Id,
                Name = c.Name
            }));
        }

        [HttpPatch]
        [Route("{id}")]
        public async Task<IActionResult> Blacklist([FromRoute] int id) {
            bool result = await _companyService.ToggleBlacklistAsync(id);

            if (result) {
                return Ok();
            } else {
                return NotFound();
            }
        }

        [HttpPatch]
        [Route("{id}")]
        public async Task<IActionResult> Watch([FromRoute] int id) {
            bool result = await _companyService.ToggleWatchAsync(id);

            if (result) {
                return Ok();
            } else {
                return NotFound();
            }
        }

        [HttpPatch]
        [Route("{id}")]
        public async Task<IActionResult> Merge([FromRoute] int id, [FromBody] int dest) {
            bool result = await _companyService.MergeAsync(id, dest);

            if (result) {
                return Ok();
            } else {
                return NotFound();
            }
        }

        [HttpGet]
        public async Task<IActionResult> Names() {
            return new JsonResult(await _companyService.GetAllNamesAsync());
        }
    }
}