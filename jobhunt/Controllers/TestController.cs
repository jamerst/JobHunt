using System.Threading.Tasks;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

using JobHunt.Configuration;
namespace JobHunt.Controllers {
    [ApiController]
    [Route("[controller]/[action]")]
    public class TestController : ControllerBase {
        private readonly SearchOptions _options;
        public TestController(IOptions<SearchOptions> options) {
            _options = options.Value;
        }

        [HttpGet]
        // [Route("~/[controller]")]
        public async Task<IActionResult> List() {
            
            return Ok(_options.IndeedPublisherId);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Test(string id) {
            return Ok($"test_{id}");
        }
    }
}