using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

using JobHunt.Configuration;
using JobHunt.Models;
using JobHunt.Searching;
namespace JobHunt.Controllers {
    [ApiController]
    [Route("[controller]/[action]")]
    public class SearchDebugController : ControllerBase {
        private readonly ISearchProvider _indeed;
        public SearchDebugController(ISearchProvider indeed) {
            _indeed = indeed;
        }

        [HttpGet]
        public async Task<IActionResult> Indeed() {
            Search search = new Search {
                Id = "test",
                Provider = "Indeed",
                Query = "Developer",
                Location = "Skipton",
                Country = "uk",
                Distance = 15
            };

            await _indeed.SearchAsync(search, new HttpClient(), new CancellationToken());
            return Ok();
        }
    }
}