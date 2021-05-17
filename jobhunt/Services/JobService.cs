using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;
using Html2Markdown;

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

        public async Task<Job> GetByIdAsync(int id) {
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

            DateTime dailyDate = date.Date.AddDays(-1);
            counts.Daily = await _context.Jobs.Where(j => j.Posted.HasValue && j.Posted.Value.Date >= dailyDate).CountAsync();

            DateTime weeklyDate = date.Date.AddDays(-7);
            counts.Weekly = await _context.Jobs.Where(j => j.Posted.HasValue && j.Posted.Value.Date >= weeklyDate).CountAsync();

            DateTime monthlyDate = date.Date.AddMonths(-1);
            counts.Monthly = await _context.Jobs.Where(j => j.Posted.HasValue && j.Posted.Value.Date >= monthlyDate).CountAsync();

            return counts;
        }

        public async Task MarkAsSeenAsync(int id) {
            Job job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == id);

            if (job != default(Job)) {
                job.Seen = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<Category>?> UpdateCategoriesAsync(int id, CategoryDto[] categories) {
            Job job = await _context.Jobs
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

            // return new list of categories
            return await _context.JobCategories
                .Include(jc => jc.Category)
                .Where(jc => jc.JobId == id)
                .Select(jc => jc.Category)
                .ToListAsync();
        }

        public async Task<Job?> UpdateAsync(int id, JobDto details) {
            Job job = await _context.Jobs
                .FirstOrDefaultAsync(j => j.Id == id);

            if (job == default(Job)) {
                return null;
            }

            job.Title = details.Title;
            job.Salary = details.Salary;
            job.Description = details.Description;

            await _context.SaveChangesAsync();

            return job;
        }

        public async Task MarkAsArchivedAsync(int id, bool toggle) {
            Job job = await _context.Jobs.FirstOrDefaultAsync(j => j.Id == id);

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
    }

    public interface IJobService {
        Task<Job> GetByIdAsync(int id);
        Task<bool> AnyWithSourceIdAsync(string provider, string id);
        Task CreateAllAsync(IEnumerable<Job> jobs);
        Task<(IEnumerable<Job>, int?)> GetLatestPagedAsync(int pageNum, int pageSize, bool count);
        Task<(IEnumerable<Job>, int?)> GetLatestPagedByCompanyAsync(int compantId, int pageNum, int pageSize, bool count);
        Task<JobCount> GetJobCountsAsync(DateTime Date);
        Task MarkAsSeenAsync(int id);
        Task<IEnumerable<Category>?> UpdateCategoriesAsync(int id, CategoryDto[] categories);
        Task<Job?> UpdateAsync(int id, JobDto details);
        Task MarkAsArchivedAsync(int id, bool toggle);
        Task<(IEnumerable<JobResultDto>, int?)> SearchPagedAsync(Filter filter, int pageNum, int pageSize, bool count);
        Task<IEnumerable<Category>> GetJobCategoriesAsync();
    }
}