using System.Threading.Tasks;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;

namespace JobHunt.Controllers {
    [ApiController]
    [Route("[controller]/[action]")]
    public class TestController : ControllerBase {
        [HttpGet]
        [Route("~/[controller]")]
        public async Task<IActionResult> List() {
            return Ok("list");
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Test(string id) {
            return Ok($"test_{id}");
        }
    }
}