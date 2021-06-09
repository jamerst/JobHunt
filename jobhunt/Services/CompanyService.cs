using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.Extensions.Logging;

using JobHunt.Data;
using JobHunt.DTO;
using JobHunt.Geocoding;
using JobHunt.Models;
using JobHunt.Searching;

namespace JobHunt.Services {
    public class CompanyService : ICompanyService {
        private readonly JobHuntContext _context;
        private readonly INominatim _nominatim;
        private readonly IPageWatcher _pageWatcher;

        public CompanyService(JobHuntContext context, INominatim nominatim, IPageWatcher pageWatcher) {
            _context = context;
            _nominatim = nominatim;
            _pageWatcher = pageWatcher;
        }

        public async Task<Company> GetByIdAsync(int id) {
            return await _context.Companies
                .AsNoTracking()
                .Include(c => c.CompanyCategories)
                    .ThenInclude(cc => cc.Category)
                .Include(c => c.AlternateNames)
                .Include(c => c.WatchedPages)
                .AsSplitQuery()
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Company> FindByNameAsync(string name) {
            return await _context.Companies
                .Include(c => c.AlternateNames)
                .FirstOrDefaultAsync(c => c.Name == name || c.AlternateNames.Any(an => an.Name == name));
        }

        public async Task CreateAllAsync(IEnumerable<Company> companies) {
            _context.Companies.AddRange(companies);

            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<Category>?> UpdateCategoriesAsync(int id, CategoryDto[] categories) {
            Company company = await _context.Companies
                .Include(c => c.CompanyCategories)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (company == default(Company)) {
                return null;
            }

            company.CompanyCategories.RemoveAll(jc => !categories.Any(c => c.Id == jc.CategoryId));

            List<Category> allCategories = await _context.Categories.ToListAsync();
            foreach (var cat in categories) {
                Category? existing = allCategories.FirstOrDefault(c => c.Id == cat.Id || c.Name == cat.Name);
                // if category already exists
                if (existing != null) {
                    // if not already added
                    if (!company.CompanyCategories.Any(cc => cc.CategoryId == existing.Id)) {
                        company.CompanyCategories.Add(new CompanyCategory { CompanyId = id, CategoryId = existing.Id});
                    }
                } else {
                    company.CompanyCategories.Add(new CompanyCategory {
                        CompanyId = id,
                        Category = new Category {
                            Name = cat.Name
                        }
                    });
                }
            }

            await _context.SaveChangesAsync();

            // return new list of categories
            return await _context.CompanyCategories
                .Include(jc => jc.Category)
                .Where(jc => jc.CompanyId == id)
                .Select(jc => jc.Category)
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<Company?> UpdateAsync(int id, CompanyDto details) {
            Company company = await _context.Companies
                .Include(c => c.WatchedPages)
                .Include(c => c.AlternateNames)
                .AsSingleQuery()
                .SingleOrDefaultAsync(c => c.Id == id);

            if (company == default(Company)) {
                return null;
            }

            company.Name = details.Name;
            company.Location = details.Location;
            company.Notes = details.Notes;
            company.Website = details.Website;
            company.Glassdoor = details.Glassdoor;
            company.LinkedIn = details.LinkedIn;
            company.Endole = details.Endole;
            company.Latitude = details.Latitude;
            company.Longitude = details.Longitude;

            IEnumerable<WatchedPageBase> sentPages = details.WatchedPages.Select(wp => wp as WatchedPageBase);
            bool newPages = sentPages.Any(wp1 => !company.WatchedPages.Any(wp2 => wp1.Url == wp2.Url));
            bool pagesModified = false;

            // remove pages that have been deleted
            company.WatchedPages.RemoveAll(wp1 => !sentPages.Any(wp2 => wp1.Url == wp2.Url));

            // update any pages which already exist
            company.WatchedPages.ForEach(wp => {
                WatchedPageBase? page = sentPages.FirstOrDefault(sp => sp.Url == wp.Url && sp != wp);
                if (page != null) {
                    pagesModified = true;
                    wp.CssSelector = page.CssSelector;
                    wp.CssBlacklist = page.CssBlacklist;
                    wp.Enabled = page.Enabled;
                }
            });

            // add new pages
            company.WatchedPages.AddRange(sentPages
                .Where(wp1 => !company.WatchedPages.Any(wp2 => wp1.Url == wp2.Url) && !string.IsNullOrEmpty(wp1.Url))
                .Select(wp => new WatchedPage {
                    Url = wp.Url,
                    CssSelector = wp.CssSelector,
                    CssBlacklist = wp.CssBlacklist
                })
            );

            company.AlternateNames.RemoveAll(n1 => !details.AlternateNames.Any(n2 => n1.Name == n2));
            company.AlternateNames.AddRange(details.AlternateNames
                .Where(n1 => !company.AlternateNames.Any(n2 => n1 == n2.Name) && !string.IsNullOrEmpty(n1))
                .Select(n => new CompanyName { Name = n })
            );

            await _context.SaveChangesAsync();

            if (pagesModified) {
                HttpClient client = new HttpClient();
                CancellationToken token = new CancellationToken();
                await _pageWatcher.RefreshCompanyAsync(company.Id, client, token);
            } else if (newPages) {
                HttpClient client = new HttpClient();
                CancellationToken token = new CancellationToken();
                await _pageWatcher.GetInitialAsync(company.Id, client, token);
            }

            return company;
        }

        public async Task<int?> CreateAsync(CompanyDto details) {
            Company company = new Company();

            if (string.IsNullOrEmpty(details.Name)) {
                return null;
            }

            if (string.IsNullOrEmpty(details.Location)) {
                return null;
            }

            company.Name = details.Name;
            company.Location = details.Location;
            company.Website = details.Website;
            company.Glassdoor = details.Glassdoor;
            company.LinkedIn = details.LinkedIn;
            company.Endole = details.Endole;

            (double? lat, double? lng) = await _nominatim.Geocode(details.Location);
            company.Latitude = lat;
            company.Longitude = lng;

            company.Watched = false;
            company.Blacklisted = false;

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            return company.Id;
        }

        public async Task<(IEnumerable<CompanyResultDto>, int?)> SearchPagedAsync(Filter filter, int pageNum, int pageSize, bool count) {
            var query = _context.Companies.AsNoTracking();

            if (!string.IsNullOrEmpty(filter.Term)) {
                query = query.Where(c => c.Name.ToLower().Contains(filter.Term.ToLower())
                    || c.AlternateNames.Any(an => an.Name.ToLower().Contains(filter.Term.ToLower()))
                );
            }
            double? lat = null, lng = null;
            if (!string.IsNullOrEmpty(filter.Location) && filter.Distance.HasValue) {
                (lat, lng) = await _nominatim.Geocode(filter.Location);

                if (lat.HasValue && lng.HasValue) {
                    query = query.Where(c =>
                        c.Latitude.HasValue
                        && c.Longitude.HasValue
                        && _context.GeoDistance(lat.Value, lng.Value, c.Latitude.Value, c.Longitude.Value) <= filter.Distance
                    );
                }
            }

            if (filter.Categories != null && filter.Categories.Count > 0) {
                query = query.Where(c => c.CompanyCategories.Any(cc => filter.Categories.Contains(cc.CategoryId)));
            }

            int? total = null;
            if (count) {
                total = await query.CountAsync();
            }

            if (lat.HasValue && lng.HasValue) {
                query = query.OrderBy(c => _context.GeoDistance(lat.Value, lng.Value, c.Latitude!.Value, c.Longitude!.Value));
            } else {
                query = query.OrderBy(c => c.Name);
            }

            IEnumerable<CompanyResultDto> results = query
                .Skip(pageNum * pageSize)
                .Take(pageSize)
                .Select(c => new CompanyResultDto {
                    Id = c.Id,
                    Name = c.Name,
                    Location = c.Location,
                    Distance = lat.HasValue && lng.HasValue ? _context.GeoDistance(lat.Value, lng.Value, c.Latitude!.Value, c.Longitude!.Value) : null
                });

            return (results, total);
        }

        public async Task<IEnumerable<Category>> GetCompanyCategoriesAsync() {
            return await _context.CompanyCategories
                .Include(cc => cc.Category)
                .GroupBy(cc => new { cc.Category.Id, cc.Category.Name })
                .OrderByDescending(g => g.Count())
                .Select(g => new Category { Id = g.Key.Id, Name = g.Key.Name})
                .ToListAsync();
        }

        public async Task<bool> ToggleBlacklistAsync(int id) {
            Company company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == id);

            if (company == default(Company)) {
                return false;
            }

            company.Blacklisted = !company.Blacklisted;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleWatchAsync(int id) {
            Company company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == id);

            if (company == default(Company)) {
                return false;
            }

            company.Watched = !company.Watched;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<CompanyNameDto>> GetAllNamesAsync() {
            return await _context.Companies
                .OrderBy(c => c.Name)
                .Select(c => new CompanyNameDto { CompanyId = c.Id, Name = c.Name })
                .ToListAsync();
        }

        public async Task<bool> MergeAsync(int srcId, int destId) {
            Company src = await _context.Companies
                .Include(c => c.AlternateNames)
                .Include(c => c.CompanyCategories)
                .Include(c => c.Jobs)
                .Include(c => c.WatchedPages)
                .AsSplitQuery()
                .SingleOrDefaultAsync(c => c.Id == srcId);
            Company dest = await _context.Companies
                .Include(c => c.AlternateNames)
                .Include(c => c.CompanyCategories)
                .Include(c => c.Jobs)
                .Include(c => c.WatchedPages)
                .AsSplitQuery()
                .SingleOrDefaultAsync(c => c.Id == destId);

            if (src == null || dest == null) {
                return false;
            }

            src.AlternateNames.ForEach(an => {
                if (!dest.AlternateNames.Any(anD => anD.Name == an.Name)) {
                    an.CompanyId = dest.Id;
                }
            });

            src.CompanyCategories.ForEach(cc => {
                if (!dest.CompanyCategories.Any(ccD => ccD.CategoryId == cc.CategoryId)) {
                    dest.CompanyCategories.Add(new CompanyCategory { CategoryId = cc.CategoryId});
                }
            });

            src.Jobs.ForEach(j => {
                j.CompanyId = dest.Id;
            });

            src.WatchedPages.ForEach(wp => {
                if (!dest.WatchedPages.Any(wpD => wpD.Url == wp.Url)) {
                    wp.CompanyId = dest.Id;
                }
            });

            if (src.Name != dest.Name) {
                dest.AlternateNames.Add(new CompanyName { Name = src.Name});
            }

            _context.Companies.Remove(src);

            await _context.SaveChangesAsync();

            return true;
        }
    }

    public interface ICompanyService {
        Task<Company> GetByIdAsync(int id);
        Task<Company> FindByNameAsync(string name);
        Task CreateAllAsync(IEnumerable<Company> companies);
        Task<IEnumerable<Category>?> UpdateCategoriesAsync(int id, CategoryDto[] categories);
        Task<Company?> UpdateAsync(int id, CompanyDto details);
        Task<int?> CreateAsync(CompanyDto details);
        Task<(IEnumerable<CompanyResultDto>, int?)> SearchPagedAsync(Filter filter, int pageNum, int pageSize, bool count);
        Task<IEnumerable<Category>> GetCompanyCategoriesAsync();
        Task<bool> ToggleBlacklistAsync(int id);
        Task<bool> ToggleWatchAsync(int id);
        Task<IEnumerable<CompanyNameDto>> GetAllNamesAsync();
        Task<bool> MergeAsync(int srcId, int destId);
    }
}