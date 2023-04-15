using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using JobHunt.PageWatcher;
using JobHunt.Searching.Indeed;
using JobHunt.Workers;
using JobHunt.Searching.Indeed.GraphQL;
using JobHunt.Searching;

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
    private readonly IWatchedPageService _wpService;

    public RefreshController(
        IIndeedApiSearchProvider indeed,
        IPageWatcher pageWatcher,
        ISearchRefreshWorker refreshWorker,
        IPageScreenshotWorker screenshotWorker,
        IJobService jobService,
        IWatchedPageService wpService)
    {
        _indeed = indeed;
        _pageWatcher = pageWatcher;
        _refreshWorker = refreshWorker;
        _screenshotWorker = screenshotWorker;
        _jobService = jobService;
        _wpService = wpService;
    }

    [HttpGet]
    public async Task Indeed(CancellationToken token)
    {
        await _indeed.SearchAllAsync(token);
    }

    [HttpGet]
    public async Task<IActionResult> GetMissingSalaries(string country, [FromServices] IIndeedGraphQLService graphQL)
    {
        int updated = 0;

        DateTimeOffset start = new DateTime(2023, 02, 01, 0, 0, 0, DateTimeKind.Utc);
        List<Job> missing = await _jobService.Set.Where(j => j.Provider == SearchProviderName.Indeed && j.Posted >= start && !j.AvgYearlySalary.HasValue).ToListAsync();
        List<string> seen = new List<string>();

        int skip = 0;
        var batch = missing.Take(500);
        while (batch.Any())
        {
            var results = await graphQL.GetJobDataAsync(batch.Select(b => b.ProviderId!), country);
            if (results != null)
            {
                foreach (var result in results.JobData.Results)
                {
                    var job = missing.First(j => j.ProviderId == result.Job.Key);
                    job.Salary = result.Job.Compensation?.GetFormattedText();
                    job.AvgYearlySalary = result.Job.Compensation?.GetAvgYearlySalary();

                    updated++;
                    seen.Add(result.Job.Key);
                }
            }

            skip += 500;
            batch = missing.Skip(skip).Take(500);
        }

        await _jobService.SaveChangesAsync();

        return new JsonResult(new
        {
            Updated = updated,
            Missing = missing.Select(j => j.ProviderId!).Except(seen)
        });
    }

    [HttpGet]
    public async Task PageWatcher(CancellationToken token)
    {
        await _pageWatcher.RefreshAllAsync(token);
    }

    [HttpGet]
    public async Task All(CancellationToken token)
    {
        await _refreshWorker.DoRefreshAsync(token);
    }

    [HttpGet]
    public async Task<IActionResult> Screenshot(CancellationToken token)
    {
        int numScreenshots = await _screenshotWorker.TakeScreenshotsAsync(token);
        return new JsonResult(numScreenshots);
    }

    [HttpGet]
    public async Task FindDuplicates(CancellationToken token, bool force = false)
    {
        await _jobService.CheckForDuplicatesAsync(force, token);
    }
}
