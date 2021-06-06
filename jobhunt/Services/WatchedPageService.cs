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

        public async Task UpdateStatusAsync(int id, string? hash = null, string? statusMessage = null) {
            WatchedPage page = await _context.WatchedPages.FirstOrDefaultAsync(p => p.Id == id);

            if (page == null) {
                return;
            }

            page.LastScraped = DateTime.Now;

            if (!string.IsNullOrEmpty(statusMessage)) {
                page.StatusMessage = statusMessage;
            } else if (!string.IsNullOrEmpty(hash)) {
                if (hash != page.Hash) {
                    page.LastUpdated = DateTime.Now;
                    page.Hash = hash;
                }
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

        public async Task<List<WatchedPage>> GetUnfetchedAsync(int companyId) {
            return await _context.WatchedPages
                .Where(wp => wp.CompanyId == companyId && string.IsNullOrEmpty(wp.Hash))
                .ToListAsync();
        }
    }

    public interface IWatchedPageService {
        Task UpdateStatusAsync(int id, string? hash = null, string? statusMessage = null);
        Task<List<WatchedPage>> GetAllActiveAsync();
        Task<List<WatchedPage>> GetUnfetchedAsync(int companyId);
    }
}