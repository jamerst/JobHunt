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
            return Ok();
        }
    }
}