using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

using JobHunt.Data;
using JobHunt.Models;

namespace JobHunt.Services {
    public class CompanyService : ICompanyService {
        private readonly JobHuntContext _context;
        public CompanyService(JobHuntContext context) {
            _context = context;
        }
        public async Task<Company> FindCompanyByNameAsync(string name) {
            return await _context.Companies
                .Include(c => c.AlternateNames)
                .FirstOrDefaultAsync(c => c.Name == name || c.AlternateNames.Any(an => an.Name == name));
        }

        public async Task CreateAllAsync(IEnumerable<Company> companies) {
            _context.Companies.AddRange(companies);

            await _context.SaveChangesAsync();
        }
    }

    public interface ICompanyService {
        Task<Company> FindCompanyByNameAsync(string name);
        Task CreateAllAsync(IEnumerable<Company> companies);
    }
}