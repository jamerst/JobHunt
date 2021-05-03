using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

using JobHunt.Data;
using JobHunt.DTO;
using JobHunt.Models;

namespace JobHunt.Services {
    public class JobService : IJobService {
        private readonly JobHuntContext _context;
        public JobService(JobHuntContext context) {
            _context = context;
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

        public async Task<(IEnumerable<Job>, int)> GetLatestPagedAsync(int pageNum, int pageSize) {
            int total = await _context.Jobs.Where(j => !j.Archived).CountAsync();

            IEnumerable<Job> results = await _context.Jobs
                .AsNoTracking()
                .Where(j => !j.Archived)
                .OrderByDescending(j => j.Posted)
                .Skip(pageNum * pageSize)
                .Take(pageSize)
                .Include(j => j.JobCategories)
                    .ThenInclude(jc => jc.Category)
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

            return await _context.JobCategories
                .Include(jc => jc.Category)
                .Where(jc => jc.JobId == id)
                .Select(jc => jc.Category)
                .ToListAsync();
        }
    }

    public interface IJobService {
        Task<Job> GetByIdAsync(int id);
        Task<bool> AnyWithSourceIdAsync(string provider, string id);
        Task CreateAllAsync(IEnumerable<Job> jobs);
        Task<(IEnumerable<Job>, int)> GetLatestPagedAsync(int pageNum, int pageSize);
        Task<JobCount> GetJobCountsAsync(DateTime Date);
        Task MarkAsSeenAsync(int id);
        Task<IEnumerable<Category>?> UpdateCategoriesAsync(int id, CategoryDto[] categories);
    }
}