namespace JobHunt.Models;
public class Search : KeyedEntity
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public required string Provider { get; set; }
    public required string Query { get; set; }
    public required string Country { get; set; }
    public string? Location { get; set; }
    public int? Distance { get; set; }
    public int? MaxAge { get; set; }
    public int? LastResultCount { get; set; }
    public bool? LastFetchSuccess { get; set; }
    public bool Enabled { get; set; } = true;
    public bool EmployerOnly { get; set; }
    public string? JobType { get; set; }
    public DateTimeOffset? LastRun { get; set; }
    public IList<Job> FoundJobs { get; set; } = null!;
    public IList<SearchRun> Runs { get; set; } = null!;

    public override string ToString()
    {
        return $"{Query} jobs in {Location} on {Provider}";
    }

    // [NotMapped]
    public string DisplayName => ToString();
}