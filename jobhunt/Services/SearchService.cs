using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

using JobHunt.Data;
using JobHunt.Models;

namespace JobHunt.Services {
    public class SearchService : ISearchService {
        private readonly JobHuntContext _context;
        public SearchService(JobHuntContext context) {
            _context = context;
        }
        public async Task UpdateFetchResultAsync(int searchId, int? count, bool? success) {
            Search search = await _context.Searches.SingleAsync(s => s.Id == searchId);
            search.LastResultCount = count;
            search.LastFetchSuccess = success;
            search.LastRun = DateTime.Now;
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<Search>> FindByProviderAsync(string provider) {
            return await _context.Searches.Where(s => s.Provider == provider).ToListAsync();
        }

        public async Task CreateSearchRunAsync(int searchId, bool success, string? message, int newJobs, int newCompanies, int timeTaken) {
            _context.SearchRuns.Add(new SearchRun {
                SearchId = searchId,
                Time = DateTime.Now,
                Success = success,
                Message = message,
                NewJobs = newJobs,
                NewCompanies = newCompanies,
                TimeTaken = timeTaken
            });

            await _context.SaveChangesAsync();
        }
    }

    public interface ISearchService {
        Task UpdateFetchResultAsync(int searchId, int? count, bool? success);
        Task<IEnumerable<Search>> FindByProviderAsync(string provider);
        Task CreateSearchRunAsync(int searchId, bool success, string? message, int newJobs, int newCompanies, int timeTaken);
    }
}