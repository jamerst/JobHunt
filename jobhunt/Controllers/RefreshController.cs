using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Mvc;

using JobHunt.Searching;
using JobHunt.Workers;

namespace JobHunt.Controllers {
    [ApiController]
    [Route("api/[controller]/[action]")]
    public class RefreshController : ControllerBase {
        private readonly IIndeedAPI _indeed;
        private readonly IPageWatcher _pageWatcher;
        private readonly ISearchRefreshWorker _refreshWorker;
        public RefreshController(IIndeedAPI indeed, IPageWatcher pageWatcher, ISearchRefreshWorker refreshWorker) {
            _indeed = indeed;
            _pageWatcher = pageWatcher;
            _refreshWorker = refreshWorker;
        }

        [HttpGet]
        public async Task Indeed() {
            CancellationToken token = new CancellationToken();
            await _indeed.SearchAllAsync(token);
        }

        [HttpGet]
        public async Task PageWatcher() {
            CancellationToken token = new CancellationToken();
            await _pageWatcher.RefreshAllAsync(token);
        }

        [HttpGet]
        public async Task All() {
            CancellationToken token = new CancellationToken();
            await _refreshWorker.DoRefreshAsync(token);
        }
    }
}