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
        public CompaniesController(ICompanyService jobService) {
            _companyService = jobService;
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
                    CareersPages = company.CareersPages.Select(cp => new {
                        Url = cp.Url,
                        CssSelector = cp.CssSelector,
                        CssBlacklist = cp.CssBlacklist,
                        LastScraped = cp.LastScraped,
                        LastUpdated = cp.LastUpdated,
                        StatusMessage = cp.StatusMessage
                    }),
                    Categories = company.CompanyCategories.Select(cc => new {
                        Id = cc.CategoryId,
                        Name = cc.Category.Name
                    }).OrderBy(c => c.Name),
                    AlternateNames = company.AlternateNames.Select(n => n.Name)
                });
            }
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
    }
}