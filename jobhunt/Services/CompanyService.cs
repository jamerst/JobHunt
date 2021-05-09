using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

using JobHunt.Data;
using JobHunt.DTO;
using JobHunt.Models;

namespace JobHunt.Services {
    public class CompanyService : ICompanyService {
        private readonly JobHuntContext _context;
        public CompanyService(JobHuntContext context) {
            _context = context;
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
                .FirstOrDefaultAsync(c => c.Id == id);

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

            company.WatchedPages.RemoveAll(wp1 => !details.WatchedPages.Any(wp2 => wp1.Url == wp2.Url));
            company.WatchedPages.AddRange(details.WatchedPages
                .Where(wp1 => !company.WatchedPages.Any(wp2 => wp1.Url == wp2.Url))
                .Select(wp => new WatchedPage {
                    Url = wp.Url,
                    CssSelector = wp.CssSelector,
                    CssBlacklist = wp.CssBlacklist
                })
            );

            company.AlternateNames.RemoveAll(n1 => !details.AlternateNames.Any(n2 => n1.Name == n2));
            company.AlternateNames.AddRange(details.AlternateNames
                .Where(n1 => !company.AlternateNames.Any(n2 => n1 == n2.Name))
                .Select(n => new CompanyName { Name = n })
            );

            await _context.SaveChangesAsync();

            return company;
        }
    }

    public interface ICompanyService {
        Task<Company> GetByIdAsync(int id);
        Task<Company> FindByNameAsync(string name);
        Task CreateAllAsync(IEnumerable<Company> companies);
        Task<IEnumerable<Category>?> UpdateCategoriesAsync(int id, CategoryDto[] categories);
        Task<Company?> UpdateAsync(int id, CompanyDto details);

    }
}