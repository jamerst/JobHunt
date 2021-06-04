using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

using JobHunt.Data;
using JobHunt.Models;

namespace JobHunt.Services {
    public class AlertService : IAlertService {
        private readonly JobHuntContext _context;
        public AlertService(JobHuntContext context) {
            _context = context;
        }
        public async Task CreateAsync(Alert alert) {
            alert.Created = DateTime.Now;
            _context.Alerts.Add(alert);
            await _context.SaveChangesAsync();
        }

        public async Task CreateErrorAsync(string title, string? message = null, string? url = null) {
            await CreateAsync(new Alert {
                Type = AlertType.Error,
                Title = title,
                Message = message,
                Url = url
            });
        }

        public async Task<IEnumerable<Alert>> GetRecentAsync() {
            return await _context.Alerts.AsNoTracking().OrderByDescending(a => a.Created).Take(20).ToListAsync();
        }

        public async Task<bool> MarkAsReadAsync(int id) {
            Alert alert = await _context.Alerts.SingleOrDefaultAsync(a => a.Id == id);

            if (alert == default(Alert)) {
                return false;
            }

            alert.Read = true;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task MarkAllAsReadAsync() {
            List<Alert> alerts = await _context.Alerts.Where(a => !a.Read).ToListAsync();

            alerts.ForEach(a => a.Read = true);

            await _context.SaveChangesAsync();
        }
    }

    public interface IAlertService {
        Task CreateAsync(Alert alert);
        Task CreateErrorAsync(string title, string? message = null, string? url = null);
        Task<IEnumerable<Alert>> GetRecentAsync();
        Task<bool> MarkAsReadAsync(int id);
        Task MarkAllAsReadAsync();
    }
}