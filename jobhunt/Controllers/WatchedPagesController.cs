using Microsoft.AspNetCore.Mvc;

using JobHunt.PageWatcher;

namespace JobHunt.Controllers;
[ApiController]
[Route("api/[controller]/[action]")]
public class WatchedPagesController : ControllerBase
{
    private readonly IWatchedPageService _wpService;
    private readonly IWatchedPageChangeService _wpcService;

    public WatchedPagesController(IWatchedPageService wpService, IWatchedPageChangeService wpcService)
    {
        _wpService = wpService;
        _wpcService = wpcService;
    }

    [HttpGet]
    [Route("~/api/watchedpages/{id}")]
    public async Task<IActionResult> Get([FromRoute] int id)
    {
        return new JsonResult(new
        {
            WatchedPage = await _wpService.FindByIdAsync(id),
            Changes = await _wpcService.FindAllChangesAsync(id)
        });
    }
    [HttpGet]
    [Route("{id}")]
    public async Task<IActionResult> Diff([FromRoute] int id)
    {
        (string? prev, string? current) = await _wpcService.GetDiffHtmlAsync(id);

        return new JsonResult(new
        {
            Previous = prev,
            Current = current
        });
    }

    [HttpGet]
    [Route("{id}")]
    public async Task<IActionResult> PreviousHtml([FromRoute] int id)
    {
        (string? prev, _) = await _wpcService.GetDiffHtmlAsync(id);

        return new ContentResult()
        {
            Content = prev,
            ContentType = "text/html"
        };
    }

    [HttpGet]
    [Route("{id}")]
    public async Task<IActionResult> Html([FromRoute] int id)
    {
        (_, string? current) = await _wpcService.GetDiffHtmlAsync(id);

        return new ContentResult()
        {
            Content = current,
            ContentType = "text/html"
        };
    }

    [HttpGet]
    [Route("{id}")]
    public async Task<IActionResult> Screenshot([FromRoute] int id)
    {
        var stream = await _wpcService.GetScreenshotAsync(id);
        if (stream != default)
        {
            return new FileStreamResult(stream, "image/webp");
        }
        else
        {
            return new NotFoundResult();
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Refresh([FromRoute] int id, [FromServices] IPageWatcher pageWatcher)
    {
        WatchedPage? page = await _wpService.FindByIdAsync(id);
        if (page != default)
        {
            await pageWatcher.RefreshAsync(page, new CancellationToken());
            return Ok();
        }
        else
        {
            return NotFound();
        }
    }
}