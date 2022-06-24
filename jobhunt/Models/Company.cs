namespace JobHunt.Models;
public class Company : KeyedEntity
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Location { get; set; } = null!;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Notes { get; set; }
    public bool Watched { get; set; } = false;
    public bool Blacklisted { get; set; } = false;
    public List<Job> Jobs { get; set; } = null!;
    public string? Website { get; set; }
    public short? Rating { get; set; }
    public string? Glassdoor { get; set; }
    public string? GlassdoorId { get; set; }
    public float? GlassdoorRating { get; set; }
    public string? LinkedIn { get; set; }
    public string? Endole { get; set; }
    public bool Recruiter { get; set; }
    public List<WatchedPage> WatchedPages { get; set; } = null!;
    public List<CompanyCategory> CompanyCategories { get; set; } = null!;
    public List<CompanyName> AlternateNames { get; set; } = null!;
}