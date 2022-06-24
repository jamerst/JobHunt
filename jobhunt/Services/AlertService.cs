using Microsoft.EntityFrameworkCore;

namespace JobHunt.Services;
public class AlertService : IAlertService
{
    private readonly JobHuntContext _context;
    private const int _maxAlerts = 20;
    public AlertService(JobHuntContext context)
    {
        _context = context;
    }
    public async Task CreateAsync(Alert alert)
    {
        alert.Created = DateTime.UtcNow;
        _context.Alerts.Add(alert);
        await _context.SaveChangesAsync();
    }

    public async Task CreateErrorAsync(string title, string? message = null, string? url = null)
    {
        await CreateAsync(new Alert
        {
            Type = AlertType.Error,
            Title = title,
            Message = message,
            Url = url
        });
    }

    public async Task<IEnumerable<Alert>> GetRecentAsync()
    {
        return await _context.Alerts.AsNoTracking().OrderByDescending(a => a.Created).Take(_maxAlerts).ToListAsync();
    }

    public async Task<bool> MarkAsReadAsync(int id)
    {
        Alert? alert = await _context.Alerts.SingleOrDefaultAsync(a => a.Id == id);

        if (alert == default(Alert))
        {
            return false;
        }

        alert.Read = true;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task MarkAllAsReadAsync()
    {
        List<Alert> alerts = await _context.Alerts.Where(a => !a.Read).ToListAsync();

        foreach (var a in alerts)
        {
            a.Read = true;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<int> GetUnreadCountAsync()
    {
        return await _context.Alerts.CountAsync(a => !a.Read);
    }
}

public interface IAlertService
{
    Task CreateAsync(Alert alert);
    Task CreateErrorAsync(string title, string? message = null, string? url = null);
    Task<IEnumerable<Alert>> GetRecentAsync();
    Task<bool> MarkAsReadAsync(int id);
    Task MarkAllAsReadAsync();
    Task<int> GetUnreadCountAsync();
}