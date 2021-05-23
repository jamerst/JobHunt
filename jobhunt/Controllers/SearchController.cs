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
    public class SearchController : ControllerBase {
        private readonly ISearchService _searchService;
        public SearchController(ISearchService searchService) {
            _searchService = searchService;
        }

        [HttpGet("~/api/search")]
        public async Task<IActionResult> GetAll([FromQuery] int page, [FromQuery] int size, [FromQuery] bool count = false) {
            (var results, int? total) = await _searchService.GetPagedAsync(page, size, count);
            return new JsonResult(new {
                total = total,
                results = results.Select(j => new {
                    Id = j.Id,
                    Enabled = j.Enabled,
                    Description = j.ToString(),
                    LastRun = j.LastRun,
                    LastRunSuccess = j.LastFetchSuccess
                })
            });
        }

        [HttpPatch("{id}")]
        public async Task Enable([FromRoute]int id) {
            await _searchService.ToggleEnabledAsync(id);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SearchDto details) {
            (int? id, string msg) = await _searchService.CreateAsync(details);

            if (id.HasValue) {
                return new JsonResult(id);
            } else {
                return BadRequest(msg);
            }
        }
    }
}