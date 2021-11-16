using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

using JobHunt.Converters;
using JobHunt.Data;
using JobHunt.DTO;
using JobHunt.Geocoding;
using JobHunt.Models;

namespace JobHunt.Services {
    public class JobService : IJobService {
        private readonly JobHuntContext _context;
        private readonly INominatim _nominatim;
        public JobService(JobHuntContext context, INominatim nominatim) {
            _context = context;
            _nominatim = nominatim;
        }

        public async Task<Job?> GetByIdAsync(int id) {
            return await _context.Jobs
                .AsNoTracking()
                .Include(j => j.Company)
                .Include(j => j.JobCategories)
                    .ThenInclude(jc => jc.Category)
                .Include(j => j.Source)
                .FirstOrDefaultAsync(j => j.Id == id);
        }

        public async Task<bool> AnyWithSourceIdAsync(string provider, string id) {
            return await _context.Jobs.AnyAsync(j => j.Provider == provider && j.ProviderId == id);
        }

        public async Task CreateAllAsync(IEnumerable<Job> jobs) {
            _context.Jobs.AddRange(jobs);

            await _context.SaveChangesAsync();
        }

        public async Task<(IEnumerable<Job>, int?)> GetLatestPagedAsync(int pageNum, int pageSize, bool count) {
            int? total = null;
            if (count) {
                total = await _context.Jobs.Where(j => !j.Archived).Take(100).CountAsync();
            }

            IEnumerable<Job> results = await _context.Jobs
                .AsNoTracking()
                .Where(j => !j.Archived)
                .OrderByDescending(j => j.Posted)
                .Take(100)
                .Skip(pageNum * pageSize)
                .Take(pageSize)
                .Include(j => j.Company)
                .ToListAsync();

            return (results, total);
        }

        public async Task<(IEnumerable<Job>, int?)> GetLatestPagedByCompanyAsync(int companyId, int pageNum, int pageSize, bool count) {
            int? total = null;
            if (count) {
                total = await _context.Jobs.Where(j => j.CompanyId == companyId).CountAsync();
            }

            IEnumerable<Job> results = await _context.Jobs
                .AsNoTracking()
                .Where(j => j.CompanyId == companyId)
                .OrderByDescending(j => j.Posted)
                .Skip(pageNum * pageSize)
                .Take(pageSize)
                .Include(j => j.Company)
                .ToListAsync();

            return (results, total);
        }

        public async Task<JobCount> GetJobCountsAsync(DateTime date) {
            JobCount counts = new JobCount();

            DateTime dailyDate = date.Date.ToUniversalTime().AddDays(-1);
            counts.Daily = await _context.Jobs.Where(j => j.Posted.HasValue && j.Posted.Value.Date >= dailyDate).CountAsync();

            DateTime weeklyDate = date.Date.ToUniversalTime().AddDays(-7);
            counts.Weekly = await _context.Jobs.Where(j => j.Posted.HasValue && j.Posted.Value.Date >= weeklyDate).CountAsync();

            DateTime monthlyDate = date.Date.ToUniversalTime().AddMonths(-1);
            counts.Monthly = await _context.Jobs.Where(j => j.Posted.HasValue && j.Posted.Value.Date >= monthlyDate).CountAsync();

            return counts;
        }

        public async Task MarkAsSeenAsync(int id) {
            Job? job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == id);

            if (job != default(Job)) {
                job.Seen = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<Category>?> UpdateCategoriesAsync(int id, CategoryDto[] categories) {
            Job? job = await _context.Jobs
                .Include(j => j.JobCategories)
                .FirstOrDefaultAsync(j => j.Id == id);

            if (job == default(Job)) {
                return null;
            }

            job.JobCategories.RemoveAll(jc => !categories.Any(c => c.Id == jc.CategoryId));

            List<Category> allCategories = await _context.Categories.ToListAsync();
            foreach (var cat in categories) {
                Category? existing = allCategories.FirstOrDefault(c => c.Id == cat.Id || c.Name == cat.Name);
                // if category already exists
                if (existing != null) {
                    // if not already added
                    if (!job.JobCategories.Any(jc => jc.CategoryId == existing.Id)) {
                        job.JobCategories.Add(new JobCategory { JobId = id, CategoryId = existing.Id});
                    }
                } else {
                    job.JobCategories.Add(new JobCategory {
                        JobId = id,
                        Category = new Category {
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

        public async Task<bool> UpdateAsync(int id, JobDto details) {
            Job? job = await _context.Jobs
                .SingleOrDefaultAsync(j => j.Id == id);

            if (job == default(Job)) {
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

        public async Task<int?> CreateAsync(NewJobDto details) {
            Job job = new Job();

            Company? company = await _context.Companies.SingleOrDefaultAsync(c => c.Id == details.CompanyId);

            job.Location = "";

            if (company != default(Company)) {
                job.CompanyId = company.Id;
                job.Latitude = company.Latitude;
                job.Longitude = company.Longitude;

                if (string.IsNullOrEmpty(details.Location)) {
                    job.Location = company.Location;
                }
            }

            if (!string.IsNullOrEmpty(details.Location)) {
                job.Location = details.Location;
                (double? lat, double? lng) = await _nominatim.Geocode(details.Location);

                if (lat.HasValue && lng.HasValue) {
                    job.Latitude = lat;
                    job.Longitude = lng;
                }
            }

            job.Title = details.Title;
            job.Salary = details.Salary;
            job.AvgYearlySalary = details.AvgYearlySalary;
            job.Url = details.Url;

            if (details.Posted.HasValue) {
                job.Posted = details.Posted;
            } else {
                job.Posted = DateTime.UtcNow;
            }

            if (!string.IsNullOrEmpty(details.Description)) {
                (bool success, string output) = await PandocConverter.Convert("html", "markdown_strict", details.Description);
                if (success) {
                    job.Description = output;
                }
            } else {
                job.Description = "";
            }

            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();

            return job.Id;
        }

        public async Task MarkAsArchivedAsync(int id, bool toggle) {
            Job? job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == id);

            if (job != default(Job)) {
                job.Archived = !(toggle && job.Archived);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<(IEnumerable<JobResultDto>, int?)> SearchPagedAsync(Filter filter, int pageNum, int pageSize, bool count) {
            var query = _context.Jobs.AsNoTracking();

            if (!string.IsNullOrEmpty(filter.Term)) {
                query = query.Where(j => j.Title.ToLower().Contains(filter.Term.ToLower()));
            }

            double? lat = null, lng = null;
            if (!string.IsNullOrEmpty(filter.Location) && filter.Distance.HasValue) {
                (lat, lng) = await _nominatim.Geocode(filter.Location);

                if (lat.HasValue && lng.HasValue) {
                    query = query.Where(j =>
                        j.Latitude.HasValue
                        && j.Longitude.HasValue
                        && _context.GeoDistance(lat.Value, lng.Value, j.Latitude.Value, j.Longitude.Value) <= filter.Distance
                    );
                }
            }

            if (filter.Posted.HasValue) {
                query = query.Where(j => j.Posted >= filter.Posted.Value);
            }

            if (filter.Categories != null && filter.Categories.Count > 0) {
                query = query.Where(j => j.JobCategories.Any(jc => filter.Categories.Contains(jc.CategoryId)));
            }

            if (filter.Status != null) {
                query = query.Where(j => j.Status == filter.Status);
            }

            if (filter.ShowArchived.HasValue) {
                query = query.Where(j => j.Archived == filter.ShowArchived || j.Archived == false);
            } else {
                query = query.Where(j => j.Archived == false);
            }

            if (filter.Recruiter.HasValue) {
                query = query.Where(j => (j.Company != null && j.Company.Recruiter == filter.Recruiter.Value));
            }

            int? total = null;
            if (count) {
                total = await query.CountAsync();
            }

            IEnumerable<JobResultDto> results = query
                .Include(j => j.Company)
                .Select(j => new JobResultDto {
                    Id = j.Id,
                    Title = j.Title,
                    Location = j.Location,
                    CompanyId = j.CompanyId,
                    CompanyName = j.Company != null ? j.Company.Name : null,
                    Posted = j.Posted,
                    Seen = j.Seen,
                    Archived = j.Archived,
                    Distance = lat.HasValue && lng.HasValue ? _context.GeoDistance(lat.Value, lng.Value, j.Latitude!.Value, j.Longitude!.Value) : null
                })
                .OrderByDescending(j => j.Posted)
                .Skip(pageNum * pageSize)
                .Take(pageSize);

            return (results, total);
        }

        public async Task<IEnumerable<Category>> GetJobCategoriesAsync() {
            return await _context.JobCategories
                .Include(jc => jc.Category)
                .GroupBy(jc => new { jc.Category.Id, jc.Category.Name })
                .OrderByDescending(g => g.Count())
                .Select(g => new Category { Id = g.Key.Id, Name = g.Key.Name})
                .ToListAsync();
        }

        public async Task<bool> UpdateStatusAsync(int id, string status) {
            Job? job = await _context.Jobs
                .SingleOrDefaultAsync(j => j.Id == id);

            if (job == default(Job)) {
                return false;
            }

            job.Status = status;

            await _context.SaveChangesAsync();

            return true;
        }

        public DbSet<Job> GetSet() {
            return _context.Jobs;
        }

        public async Task<IQueryable<Job>> GetFilteredSet(string location, int distance) {
            double? lat = null, lng = null;

            (lat, lng) = await _nominatim.Geocode(location);
            if (lat.HasValue && lng.HasValue) {
                return _context.Jobs
                .Where(j =>
                    j.Latitude.HasValue
                    && j.Longitude.HasValue
                    && _context.GeoDistance(lat.Value, lng.Value, j.Latitude.Value, j.Longitude.Value) <= distance
                );
            } else {
                return GetSet();
            }
        }
    }

    public interface IJobService {
        Task<Job?> GetByIdAsync(int id);
        Task<bool> AnyWithSourceIdAsync(string provider, string id);
        Task CreateAllAsync(IEnumerable<Job> jobs);
        Task<(IEnumerable<Job>, int?)> GetLatestPagedAsync(int pageNum, int pageSize, bool count);
        Task<(IEnumerable<Job>, int?)> GetLatestPagedByCompanyAsync(int compantId, int pageNum, int pageSize, bool count);
        Task<JobCount> GetJobCountsAsync(DateTime Date);
        Task MarkAsSeenAsync(int id);
        Task<IEnumerable<Category>?> UpdateCategoriesAsync(int id, CategoryDto[] categories);
        Task<bool> UpdateAsync(int id, JobDto details);
        Task<int?> CreateAsync(NewJobDto details);
        Task MarkAsArchivedAsync(int id, bool toggle);
        Task<(IEnumerable<JobResultDto>, int?)> SearchPagedAsync(Filter filter, int pageNum, int pageSize, bool count);
        Task<IEnumerable<Category>> GetJobCategoriesAsync();
        Task<bool> UpdateStatusAsync(int id, string status);
        DbSet<Job> GetSet();
        Task<IQueryable<Job>> GetFilteredSet(string location, int distance);
    }
}