using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Mvc;

using JobHunt.Services;

namespace JobHunt.Controllers {
    [ApiController]
    [Route("api/[controller]/[action]")]
    public class WatchedPagesController : ControllerBase {
        private readonly IWatchedPageService _wpService;
        private readonly IWatchedPageChangeService _wpcService;

        public WatchedPagesController(IWatchedPageService wpService, IWatchedPageChangeService wpcService) {
            _wpService = wpService;
            _wpcService = wpcService;
        }

        [HttpGet]
        [Route("~/api/watchedpages/{id}")]
        public async Task<IActionResult> Get([FromRoute] int id) {
            return new JsonResult(new {
                WatchedPage = await _wpService.FindByIdAsync(id),
                Changes = await _wpcService.FindAllChangesAsync(id)
            });
        }
        [HttpGet]
        [Route("{id}")]
        public async Task<IActionResult> Diff([FromRoute] int id) {
            (string? prev, string? current) = await _wpcService.GetDiffHtmlAsync(id);

            return new JsonResult(new {
                Previous = prev,
                Current = current
            });
        }
    }
}