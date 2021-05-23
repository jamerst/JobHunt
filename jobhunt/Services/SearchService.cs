using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

using JobHunt.Data;
using JobHunt.DTO;
using JobHunt.Models;
using JobHunt.Searching;

namespace JobHunt.Services {
    public class SearchService : ISearchService {
        private readonly JobHuntContext _context;
        public SearchService(JobHuntContext context) {
            _context = context;
        }

        public async Task<IEnumerable<Search>> FindEnabledByProviderAsync(string provider) {
            return await _context.Searches.Where(s => s.Provider == provider && s.Enabled).ToListAsync();
        }

        public async Task CreateSearchRunAsync(int searchId, bool success, string? message, int newJobs, int newCompanies, int timeTaken) {
            Search search = await _context.Searches.SingleAsync(s => s.Id == searchId);
            search.LastResultCount = newJobs;
            search.LastFetchSuccess = success;
            search.LastRun = DateTime.Now;

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

        public async Task<(IEnumerable<Search>, int?)> GetPagedAsync(int pageNum, int pageSize, bool count) {
            int? total = null;
            if (count) {
                total = await _context.Searches.CountAsync();
            }

            IEnumerable<Search> results = await _context.Searches
                .AsNoTracking()
                .OrderByDescending(s => s.LastRun ?? DateTime.MinValue)
                .Skip(pageNum * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (results, total);
        }

        public async Task ToggleEnabledAsync(int searchId) {
            Search search = await _context.Searches.SingleAsync(s => s.Id == searchId);
            search.Enabled = !search.Enabled;
            await _context.SaveChangesAsync();
        }

        public async Task<(int?, string)> CreateAsync(SearchDto details) {
            Search search = new Search();

            if (SearchProviderName.AllProviders.Contains(details.Provider)) {
                search.Provider = details.Provider;
            } else {
                return (null, "Unknown provider");
            }

            search.Query = details.Query;
            search.Location = details.Location;
            search.Distance = details.Distance;
            search.MaxAge = details.MaxAge;
            search.EmployerOnly = details.EmployerOnly;

            if (search.Provider == SearchProviderName.Indeed) {
                if (IndeedAPI.SupportedCountries.Contains(details.Country.ToLower())) {
                    search.Country = details.Country;
                } else {
                    return (null, "Country not supported");
                }
            }

            if (!string.IsNullOrEmpty(search.JobType) && search.Provider == SearchProviderName.Indeed) {
                if (IndeedAPI.JobTypes.Contains(details.JobType)) {
                    search.JobType = details.JobType;
                } else {
                    return (null, "Unknown job type");
                }
            }

            _context.Searches.Add(search);
            await _context.SaveChangesAsync();

            return (search.Id, "");
        }
    }

    public interface ISearchService {
        Task<IEnumerable<Search>> FindEnabledByProviderAsync(string provider);
        Task CreateSearchRunAsync(int searchId, bool success, string? message, int newJobs, int newCompanies, int timeTaken);
        Task<(IEnumerable<Search>, int?)> GetPagedAsync(int pageNum, int pageSize, bool count);
        Task ToggleEnabledAsync(int searchId);
        Task<(int?, string)> CreateAsync(SearchDto details);
    }
}