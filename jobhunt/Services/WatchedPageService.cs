using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

using JobHunt.Data;
using JobHunt.Models;

namespace JobHunt.Services {
    public class WatchedPageService : IWatchedPageService {
        private readonly JobHuntContext _context;
        public WatchedPageService(JobHuntContext context) {
            _context = context;
        }

        public async Task<WatchedPage?> FindByIdAsync(int id) {
            return await _context.WatchedPages
                .Include(p => p.Company)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task UpdateStatusAsync(int id, bool changed = false, string? statusMessage = null) {
            WatchedPage? page = await _context.WatchedPages.FirstOrDefaultAsync(p => p.Id == id);

            if (page == default) {
                return;
            }

            page.LastScraped = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(statusMessage)) {
                page.StatusMessage = statusMessage;
            } else if (changed) {
                page.LastUpdated = DateTime.UtcNow;
                page.StatusMessage = null;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<List<WatchedPage>> GetAllActiveAsync() {
            return await _context.WatchedPages
                .Include(wp => wp.Company)
                .Where(wp => wp.Enabled)
                .ToListAsync();
        }

        public async Task<List<WatchedPage>> GetActiveUnfetchedAsync(int companyId) {
            return await _context.WatchedPages
                .Where(wp => wp.CompanyId == companyId && wp.Enabled && !wp.Changes.Any())
                .ToListAsync();
        }

        public async Task<List<WatchedPage>> GetActiveByCompanyAsync(int companyId) {
            return await _context.WatchedPages
                .Where(wp => wp.CompanyId == companyId && wp.Enabled)
                .ToListAsync();
        }
    }

    public interface IWatchedPageService {
        Task<WatchedPage?> FindByIdAsync(int id);
        Task UpdateStatusAsync(int id, bool changed = false, string? statusMessage = null);
        Task<List<WatchedPage>> GetAllActiveAsync();
        Task<List<WatchedPage>> GetActiveUnfetchedAsync(int companyId);
        Task<List<WatchedPage>> GetActiveByCompanyAsync(int companyId);
    }
}