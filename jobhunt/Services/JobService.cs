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

    public async Task<Job?> GetByIdAsync(int id)
    {
        return await _context.Jobs
            .AsNoTracking()
            .Include(j => j.Company)
            .Include(j => j.JobCategories)
                .ThenInclude(jc => jc.Category)
            .Include(j => j.Source)
            .FirstOrDefaultAsync(j => j.Id == id);
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

    public async Task<JobCount> GetJobCountsAsync(DateTime date)
    {
        JobCount counts = new JobCount();

        DateTime dailyDate = date.Date.ToUniversalTime().AddDays(-1);
        counts.Daily = await _context.Jobs.CountAsync(j => j.Posted.HasValue && j.Posted.Value.Date >= dailyDate);

        DateTime weeklyDate = date.Date.ToUniversalTime().AddDays(-7);
        counts.Weekly = await _context.Jobs.CountAsync(j => j.Posted.HasValue && j.Posted.Value.Date >= weeklyDate);

        DateTime monthlyDate = date.Date.ToUniversalTime().AddMonths(-1);
        counts.Monthly = await _context.Jobs.CountAsync(j => j.Posted.HasValue && j.Posted.Value.Date >= monthlyDate);

        return counts;
    }

    public async Task MarkAsSeenAsync(int id)
    {
        Job? job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == id);

        if (job != default(Job))
        {
            job.Seen = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<IEnumerable<Category>?> UpdateCategoriesAsync(int id, CategoryDto[] categories)
    {
        Job? job = await _context.Jobs
            .Include(j => j.JobCategories)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (job == default(Job))
        {
            return null;
        }

        job.JobCategories.RemoveAll(jc => !categories.Any(c => c.Id == jc.CategoryId));

        List<Category> allCategories = await _context.Categories.ToListAsync();
        foreach (var cat in categories)
        {
            Category? existing = allCategories.FirstOrDefault(c => c.Id == cat.Id || c.Name == cat.Name);
            // if category already exists
            if (existing != null)
            {
                // if not already added
                if (!job.JobCategories.Any(jc => jc.CategoryId == existing.Id))
                {
                    job.JobCategories.Add(new JobCategory { JobId = id, CategoryId = existing.Id });
                }
            }
            else
            {
                job.JobCategories.Add(new JobCategory
                {
                    JobId = id,
                    Category = new Category
                    {
                        Name = cat.Name
                    }
                });
            }
        }

        await _context.SaveChangesAsync();

        _context.Categories.RemoveRange(_context.Categories.Where(c => !c.CompanyCategories.Any() && !c.JobCategories.Any()));
        await _context.SaveChangesAsync();

        // return new list of categories
        return await _context.JobCategories
            .Include(jc => jc.Category)
            .Where(jc => jc.JobId == id)
            .Select(jc => jc.Category)
            .ToListAsync();
    }

    public async Task<bool> UpdateAsync(int id, JobDto details)
    {
        Job? job = await _context.Jobs
            .SingleOrDefaultAsync(j => j.Id == id);

        if (job == default(Job))
        {
            return false;
        }

        job.Title = details.Title;
        job.Salary = details.Salary;
        job.AvgYearlySalary = details.AvgYearlySalary;
        job.Description = details.Description;
        job.Notes = details.Notes;
        job.Latitude = details.Latitude;
        job.Longitude = details.Longitude;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<int?> CreateAsync(NewJobDto details)
    {
        Job job = new Job();

        Company? company = await _context.Companies.SingleOrDefaultAsync(c => c.Id == details.CompanyId);

        job.Location = "";

        if (company != default(Company))
        {
            job.CompanyId = company.Id;
            job.Latitude = company.Latitude;
            job.Longitude = company.Longitude;

            if (string.IsNullOrEmpty(details.Location))
            {
                job.Location = company.Location;
            }
        }

        if (!string.IsNullOrEmpty(details.Location))
        {
            job.Location = details.Location;

            Coordinate? coord = await _geocoder.GeocodeAsync(details.Location);
            job.Latitude = coord?.Latitude;
            job.Longitude = coord?.Longitude;
        }

        job.Title = details.Title;
        job.Salary = details.Salary;
        job.AvgYearlySalary = details.AvgYearlySalary;
        job.Url = details.Url;

        if (details.Posted.HasValue)
        {
            job.Posted = details.Posted;
        }
        else
        {
            job.Posted = DateTime.UtcNow;
        }

        if (!string.IsNullOrEmpty(details.Description))
        {
            (bool success, string output) = await PandocConverter.ConvertAsync("html", "markdown_strict", details.Description);
            if (success)
            {
                job.Description = output;
            }
        }
        else
        {
            job.Description = "";
        }

        _context.Jobs.Add(job);
        await _context.SaveChangesAsync();

        return job.Id;
    }

    public async Task ArchiveAsync(int id, bool toggle)
    {
        Job? job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == id);

        if (job != default)
        {
            job.Archived = !(toggle && job.Archived);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<IEnumerable<Category>> GetJobCategoriesAsync()
    {
        return await _context.JobCategories
            .Include(jc => jc.Category)
            .GroupBy(jc => new { jc.Category.Id, jc.Category.Name })
            .OrderByDescending(g => g.Count())
            .Select(g => new Category { Id = g.Key.Id, Name = g.Key.Name })
            .ToListAsync();
    }

    public async Task<bool> UpdateStatusAsync(int id, string status)
    {
        Job? job = await _context.Jobs
            .SingleOrDefaultAsync(j => j.Id == id);

        if (job == default(Job))
        {
            return false;
        }

        job.Status = status;

        await _context.SaveChangesAsync();

        return true;
    }

    public DbSet<Job> GetSet()
    {
        return _context.Jobs;
    }

    public async Task<Job?> FindDuplicateAsync(Job job)
    {
        IQueryable<Job> jobs = _context.Jobs
            .Where(j => j.Id != job.Id)
            .Include(j => j.JobCategories);

        if (_options.DuplicateCheckMonths.HasValue && job.Posted.HasValue)
        {
            DateTime lower = job.Posted.Value.AddMonths(-_options.DuplicateCheckMonths.Value).Date;
            DateTime upper = job.Posted.Value.AddMonths(_options.DuplicateCheckMonths.Value).Date;

            jobs = jobs.Where(j => !j.Posted.HasValue || (j.Posted > lower && j.Posted < upper));
        }

        // Inner join each job with the job we are checking for
        // This looks silly, but it gives a substantial performance increase because doing it this way means that the
        // index can be used properly. When passing in the title or description as parameters they cannot use the index,
        // so must be re-computed every time, leading to a significant performance penalty.
        // This way reduces the query time from 300ms to <1ms
        var joinedJobs = jobs.Join(
            _context.Jobs,
            j1 => job.Id,
            j2 => j2.Id,
            (j1, j2) => new { Job1 = j1, Job2 = j2 }
        );

        // set threshold values for similarity operations

        // this must be done because the similarity() function cannot use indexes, but the % operator can and using
        // indexes makes searching MUCH faster

        // unfortunately we can't use the same similarity measure for both the Title and Description since you can only
        // set one threshold value, but that doesn't really matter
        await _setThreshold("word_similarity_threshold", _options.TitleSimilarityThreshold);
        await _setThreshold("similarity_threshold", _options.DescriptionSimilarityThreshold);

        // check for similarity based on Title and Description first
        Job? result = await joinedJobs
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

    public override async Task<bool> DeleteAsync(int id)
    {
        Job? job = await FindByIdAsync(id);
        if (job == default)
        {
            return false;
        }

        job.Deleted = true;
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

        if (!entity.Latitude.HasValue || !entity.Longitude.HasValue)
        {
            var result = await _geocoder.GeocodeAsync(entity.Location);

            if (result.HasValue)
            {
                entity.Latitude = result.Value.Latitude;
                entity.Longitude = result.Value.Longitude;
            }
        }

        // workaround for stupid OData bug where all dates are parsed as Unspecified
        if (entity.Posted?.Kind == DateTimeKind.Unspecified)
        {
            entity.Posted = DateTime.SpecifyKind(entity.Posted.Value, DateTimeKind.Utc);
        }

        if (entity.DateApplied?.Kind == DateTimeKind.Unspecified)
        {
            entity.Posted = DateTime.SpecifyKind(entity.DateApplied.Value, DateTimeKind.Utc);
        }

        return entity;
    }
}

public interface IJobService : IODataBaseService<Job>
{
    Task<Job?> GetByIdAsync(int id);
    Task<bool> AnyWithProviderIdAsync(string provider, string id);
    Task CreateAllAsync(IEnumerable<Job> jobs);
    Task<JobCount> GetJobCountsAsync(DateTime date);
    Task MarkAsSeenAsync(int id);
    Task<IEnumerable<Category>?> UpdateCategoriesAsync(int id, CategoryDto[] categories);
    Task<bool> UpdateAsync(int id, JobDto details);
    Task<int?> CreateAsync(NewJobDto details);
    Task ArchiveAsync(int id, bool toggle);
    Task<IEnumerable<Category>> GetJobCategoriesAsync();
    Task<bool> UpdateStatusAsync(int id, string status);
    DbSet<Job> GetSet();
    Task<Job?> FindDuplicateAsync(Job job);
}