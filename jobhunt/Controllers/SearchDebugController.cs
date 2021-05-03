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
        private readonly IIndeedAPI _indeed;
        public SearchDebugController(IIndeedAPI indeed) {
            _indeed = indeed;
        }

        [HttpGet]
        public async Task<IActionResult> Indeed() {
            HttpClient client = new HttpClient();
            CancellationToken token = new CancellationToken();
            await _indeed.SearchAllAsync(client, token);
            return Ok();
        }
    }
}