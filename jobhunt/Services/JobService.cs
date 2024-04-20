using Microsoft.EntityFrameworkCore;

using JobHunt.Converters;
using JobHunt.Geocoding;
using JobHunt.Services.BaseServices;

namespace JobHunt.Services;
public class JobService : ODataBaseService<Job>, IJobService
{
    private readonly IGeocoder _geocoder;
    private readonly SearchOptions _options;
    private readonly ILogger _logger;
    public JobService(JobHuntContext context, IGeocoder geocoder, IOptions<SearchOptions> options, ILogger<JobService> logger) : base(context)
    {
        _geocoder = geocoder;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<bool> AnyWithProviderIdAsync(string provider, string id)
    {
        return await _context.Jobs
            .IgnoreQueryFilters()
            .AnyAsync(j => j.Provider == provider && j.ProviderId == id);
    }

    public async Task CreateAllAsync(IEnumerable<Job> jobs)
    {
        _context.Jobs.AddRange(jobs);

        await _context.SaveChangesAsync();
    }

    public async Task<JobCount> GetJobCountsAsync()
    {
        JobCount counts = new JobCount();

        DateTime today = DateTime.UtcNow.Date;

        DateTime dailyDate = today.AddDays(-1);
        counts.Daily = await _context.Jobs.CountAsync(j => j.Posted.Date >= dailyDate);

        DateTime weeklyDate = today.AddDays(-7);
        counts.Weekly = await _context.Jobs.CountAsync(j => j.Posted.Date >= weeklyDate);

        DateTime monthlyDate = today.AddMonths(-1);
        counts.Monthly = await _context.Jobs.CountAsync(j => j.Posted.Date >= monthlyDate);

        return counts;
    }

    public IAsyncEnumerable<Category> GetJobCategories()
    {
        return _context.Categories
            .Where(c => c.JobCategories.Any())
            .AsAsyncEnumerable();
    }

    public async Task CheckForDuplicatesAsync(bool force, CancellationToken token)
    {
        var jobs = _context.Jobs
            .Where(j => !j.CheckedForDuplicate || force)
            .Include(j => j.JobCategories)
            .AsAsyncEnumerable();

        await foreach (var job in jobs)
        {
            if (token.IsCancellationRequested)
            {
                break;
            }

            var duplicate = await FindDuplicateAsync(job);
            if (duplicate != default)
            {
                job.DuplicateJobId = duplicate.Id;
                job.ActualCompanyId = duplicate.ActualCompanyId;

                job.JobCategories.AddRange(
                        duplicate.JobCategories
                            .Where(c1 => ! job.JobCategories.Any(c2 => c1.CategoryId == c2.CategoryId))
                            .Select(c => new JobCategory { CategoryId = c.CategoryId })
                    );

                if (duplicate.Deleted && duplicate.DeleteDuplicates == true)
                {
                    job.Deleted = true;
                    job.DeleteDuplicates = true;
                }
            }

            job.CheckedForDuplicate = true;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<Job?> FindDuplicateAsync(Job job)
    {
        IQueryable<Job> jobs = _context.Jobs
            .Where(j => j.Id != job.Id && j.Posted <= job.Posted)
            .Include(j => j.JobCategories);

        if (_options.DuplicateCheckMonths.HasValue)
        {
            DateTimeOffset lower = job.Posted.AddMonths(-_options.DuplicateCheckMonths.Value).Date;

            jobs = jobs.Where(j => j.Posted > lower);
        }

        // Inner join each job with the job we are checking for
        // This looks silly, but it gives a substantial performance increase because doing it this way means that the
        // index can be used properly. When passing in the title or description as parameters they cannot use the index,
        // so must be re-computed every time, leading to a significant performance penalty.
        // This way reduces the query time from 300ms to <1ms
        var joinedJobs = jobs.Join(
            _context.Jobs.Where(j => j.Id == job.Id),
            j1 => job.Id,
            j2 => j2.Id,
            (j1, j2) => new { Job1 = j1, Job2 = j2 }
        );

        Job? result;

        // set threshold values for similarity operations

        // this must be done because the similarity() function cannot use indexes, but the % operator can and using
        // indexes makes searching MUCH faster

        // unfortunately we can't use the same similarity measure for both the Title and Description since you can only
        // set one threshold value, but that doesn't really matter

        // this may not work in some contexts, there appears to be some EF weirdness where these commands don't take
        // effect - maybe they're being run in a separate connection? They do work when called from
        // CheckForDuplicatesAsync though, so no idea why the behaviour changes depending on where it is called from
        await _setThreshold("word_similarity_threshold", _options.TitleSimilarityThreshold);
        await _setThreshold("similarity_threshold", _options.DescriptionSimilarityThreshold);

        // check for similarity based on Title and Description first
        result = await joinedJobs
            .Where(x => EF.Functions.TrigramsAreWordSimilar(x.Job1.Title, x.Job2.Title)
                && EF.Functions.TrigramsAreSimilar(x.Job1.Description, x.Job2.Description)
            )
            .Select(x => x.Job1)
            .OrderByDescending(j => j.Posted)
            .FirstOrDefaultAsync();

        if (result != default)
        {
            return result;
        }
        else
        {
            // if no matches check again checking just for identical/very close to identical descriptions
            await _setThreshold("similarity_threshold", _options.IdenticalDescriptionSimilarityThreshold);

            return await joinedJobs
                .Where(x => EF.Functions.TrigramsAreSimilar(x.Job1.Description, x.Job2.Description))
                .Select(x => x.Job1)
                .OrderByDescending(j => j.Posted)
                .FirstOrDefaultAsync();
        }
    }


    private async Task _setThreshold(string thresholdType, double threshold)
    {
        await _context.Database.ExecuteSqlRawAsync($"SET pg_trgm.{thresholdType} = {threshold};");
    }

    public override Task<bool> DeleteAsync(int id) => DeleteAsync(id, null);

    public async Task<bool> DeleteAsync(int id, bool? deleteDuplicates)
    {
        Job? job = await FindByIdAsync(id);
        if (job == default)
        {
            return false;
        }

        job.Deleted = true;
        job.DeleteDuplicates = deleteDuplicates;
        await SaveChangesAsync();

        return true;
    }

    public override async Task<Job> BeforeSaveAsync(Job entity)
    {
        if (!string.IsNullOrEmpty(entity.Description) && StringUtils.IsHtml(entity.Description))
        {
            (bool success, string output) = await PandocConverter.ConvertAsync("html", "markdown_strict", entity.Description);

            if (success)
            {
                entity.Description = output;
            }
            else
            {
                _logger.LogWarning("Failed to convert job description to markdown {error}", output);
            }
        }

        if (!string.IsNullOrEmpty(entity.Location) && (!entity.Latitude.HasValue || !entity.Longitude.HasValue))
        {
            var result = await _geocoder.GeocodeAsync(entity.Location);

            if (result.HasValue)
            {
                entity.Latitude = result.Value.Latitude;
                entity.Longitude = result.Value.Longitude;
            }
        }

        return entity;
    }
}

public interface IJobService : IODataBaseService<Job>
{
    Task<bool> AnyWithProviderIdAsync(string provider, string id);
    Task CreateAllAsync(IEnumerable<Job> jobs);
    Task<JobCount> GetJobCountsAsync();
    IAsyncEnumerable<Category> GetJobCategories();
    Task CheckForDuplicatesAsync(bool force, CancellationToken token);
    Task<bool> DeleteAsync(int id, bool? deleteDuplicates);

    /// <summary>
    /// Find the newest duplicate posted before a given job
    /// </summary>
    /// <param name="job">Job to find duplicate of</param>
    /// <returns>Job which is a likely duplicate, null if none found</returns>
    Task<Job?> FindDuplicateAsync(Job job);
}