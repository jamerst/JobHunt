namespace JobHunt.Models;
public class Job : KeyedEntity
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string? Salary { get; set; }
    public int? AvgYearlySalary { get; set; }
    public string Location { get; set; } = null!;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Url { get; set; }
    public int? CompanyId { get; set; }
    public Company? Company { get; set; }
    public DateTime? Posted { get; set; }
    public string? Notes { get; set; }
    public bool Seen { get; set; } = false;
    public bool Archived { get; set; } = false;
    public string Status { get; set; } = JobStatus.NotApplied;
    public DateTime? DateApplied { get; set; }
    public List<JobCategory> JobCategories { get; set; } = null!;
    public string? Provider { get; set; }
    public string? ProviderId { get; set; }
    public int? SourceId { get; set; }
    public Search? Source { get; set; }
}