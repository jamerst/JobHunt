using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Query.Validator;

using Microsoft.EntityFrameworkCore;

namespace JobHunt.Controllers.OData;

public class JobController : ODataBaseController<Job>
{
    private IJobService _service;
    private ILogger _logger;

    public JobController(IJobService service, ILogger<JobController> logger) : base(service)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Need a custom method for grouping jobs by posted date for the time being.
    /// This is due to a bug in AspNetCoreOData where the date() function isn't actually translated properly
    /// See https://github.com/OData/AspNetCoreOData/issues/792
    /// </summary>
    [HttpGet]
    [Route("~/api/odata/groupedjobs")]
    public async Task<IActionResult> GetGroupedByDayAsync(ODataQueryOptions<Job> queryOptions)
    {
        queryOptions.Validate(new ODataValidationSettings());

        IQueryable<Job> jobs = _service.Set;
        jobs = (IQueryable<Job>)queryOptions.ApplyTo(jobs);

        var grouped = await jobs
            .GroupBy(j => j.Posted.Date)
            .Select(g => new
            {
                Posted = g.Key,
                Count = g.Count()
            })
            .OrderBy(g => g.Posted)
            .ToListAsync();

        if (grouped.Any())
        {
            // fill in gaps where no jobs were posted
            var complete = grouped.Skip(1).Aggregate(grouped.Take(1).ToList(), (a, x) =>
            {
                var last = a.Last();

                // add missing days if more than one day after last day where jobs were posted
                if (x.Posted > last.Posted.AddDays(1))
                {
                    int days = (x.Posted - last.Posted).Days - 1;

                    a.AddRange(Enumerable.Range(1, days)
                        .Select(i => new
                        {
                            Posted = last.Posted.AddDays(i),
                            Count = 0
                        })
                    );
                }

                // add current day
                a.Add(x);

                return a;
            });

            return Ok(complete);
        }
        else
        {
            return Ok(grouped);
        }
    }
}