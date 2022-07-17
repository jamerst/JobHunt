using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using JobHunt.PageWatcher;
using JobHunt.Searching.Indeed;
using JobHunt.Workers;

namespace JobHunt.Controllers;
[ApiController]
[Route("api/[controller]/[action]")]
public class RefreshController : ControllerBase
{
    private readonly IIndeedApiSearchProvider _indeed;
    private readonly IPageWatcher _pageWatcher;
    private readonly ISearchRefreshWorker _refreshWorker;
    private readonly IPageScreenshotWorker _screenshotWorker;
    private readonly IJobService _jobService;
    public RefreshController(IIndeedApiSearchProvider indeed, IPageWatcher pageWatcher, ISearchRefreshWorker refreshWorker, IPageScreenshotWorker screenshotWorker, IJobService jobService)
    {
        _indeed = indeed;
        _pageWatcher = pageWatcher;
        _refreshWorker = refreshWorker;
        _screenshotWorker = screenshotWorker;
        _jobService = jobService;
    }

    [HttpGet]
    public async Task Indeed()
    {
        CancellationToken token = new CancellationToken();
        await _indeed.SearchAllAsync(token);
    }

    [HttpGet]
    public async Task PageWatcher()
    {
        CancellationToken token = new CancellationToken();
        await _pageWatcher.RefreshAllAsync(token);
    }

    [HttpGet]
    public async Task All()
    {
        CancellationToken token = new CancellationToken();
        await _refreshWorker.DoRefreshAsync(token);
    }

    [HttpGet]
    public async Task<IActionResult> Screenshot()
    {
        CancellationToken token = new CancellationToken();
        int numScreenshots = await _screenshotWorker.TakeScreenshotsAsync(token);
        return new JsonResult(numScreenshots);
    }

    [HttpGet]
    public async Task FindDuplicates()
    {
        var jobs = _jobService.Set
            .Where(j => !j.DuplicateJobId.HasValue)
            .Include(j => j.JobCategories)
            .AsAsyncEnumerable();

        await foreach (var job in jobs)
        {
            var duplicate = await _jobService.FindDuplicateAsync(job);
            if (duplicate != default)
            {
                job.DuplicateJobId = duplicate.Id;

                job.JobCategories.AddRange(
                        duplicate.JobCategories
                            .Where(c1 => ! job.JobCategories.Any(c2 => c1.CategoryId == c2.CategoryId))
                            .Select(c => new JobCategory { CategoryId = c.CategoryId })
                    );
            }
        }

        await _jobService.SaveChangesAsync();
    }
}
