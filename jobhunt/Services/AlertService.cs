using System.Threading.Tasks;

using JobHunt.Data;
using JobHunt.Models;

namespace JobHunt.Services {
    public class AlertService : IAlertService {
        private readonly JobHuntContext _context;
        public AlertService(JobHuntContext context) {
            _context = context;
        }
        public async Task CreateAsync(Alert alert) {
            _context.Alerts.Add(alert);
            await _context.SaveChangesAsync();
        }
    }

    public interface IAlertService {
        Task CreateAsync(Alert alert);
    }
}