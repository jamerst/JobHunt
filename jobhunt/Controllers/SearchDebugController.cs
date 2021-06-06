using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Mvc;

using JobHunt.Searching;
namespace JobHunt.Controllers {
    [ApiController]
    [Route("api/[controller]/[action]")]
    public class SearchDebugController : ControllerBase {
        private readonly IIndeedAPI _indeed;
        private readonly IPageWatcher _pageWatcher;
        public SearchDebugController(IIndeedAPI indeed, IPageWatcher pageWatcher) {
            _indeed = indeed;
            _pageWatcher = pageWatcher;
        }

        [HttpGet]
        public async Task<IActionResult> Indeed() {
            HttpClient client = new HttpClient();
            CancellationToken token = new CancellationToken();
            await _indeed.SearchAllAsync(client, token);
            return Ok();
        }

        [HttpGet]
        public async Task<IActionResult> PageWatcher() {
            HttpClient client = new HttpClient();
            CancellationToken token = new CancellationToken();
            await _pageWatcher.RefreshAllAsync(client, token);
            return Ok();
        }
    }
}