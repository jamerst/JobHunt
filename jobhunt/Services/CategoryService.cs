using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

using JobHunt.Data;
using JobHunt.Models;

namespace JobHunt.Services {
    public class CategoryService : ICategoryService {
        private readonly JobHuntContext _context;

        public CategoryService(JobHuntContext context) {
            _context = context;
        }

        public async Task<IEnumerable<Category>> GetAllAsync() {
            return await _context.Categories.OrderBy(c => c.Name).ToListAsync();
        }
    }
    public interface ICategoryService {
        Task<IEnumerable<Category>> GetAllAsync();
    }
}