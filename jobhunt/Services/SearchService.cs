using System;
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
        public async Task UpdateFetchResultAsync(string searchId, int? count, bool? success) {
            Search search = await _context.Searches.SingleAsync(s => s.Id == searchId);
            search.LastResultCount = count;
            search.LastFetchSuccess = success;
            search.LastRun = DateTime.Now;
            await _context.SaveChangesAsync();
        }
    }

    public interface ISearchService {
        Task UpdateFetchResultAsync(string searchId, int? count, bool? success);
    }
}