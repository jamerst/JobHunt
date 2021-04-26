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
        public async Task<bool> AnyWithSourceIdAsync(string provider, string id) {
            return await _context.Jobs.AnyAsync(j => j.Provider == provider && j.ProviderId == id);
        }
    }

    public interface IJobService {
        Task<bool> AnyWithSourceIdAsync(string provider, string id);
    }
}