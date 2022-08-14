namespace JobHunt.Models;
public class WatchedPage : KeyedEntity
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public string Url { get; set; } = null!;
    public string? CssSelector { get; set; }
    public string? CssBlacklist { get; set; }
    public DateTimeOffset? LastScraped { get; set; }
    public DateTimeOffset? LastUpdated { get; set; }
    public string? StatusMessage { get; set; }
    public bool Enabled { get; set; } = true;
    public bool RequiresJS { get; set; }
    public List<WatchedPageChange> Changes { get; set; } = null!;
}