namespace JobHunt.Models;
public class WatchedPage : WatchedPageBase
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public override string Url { get; set; } = null!;
    public override string? CssSelector { get; set; }
    public override string? CssBlacklist { get; set; }
    public DateTime? LastScraped { get; set; }
    public DateTime? LastUpdated { get; set; }
    public string? StatusMessage { get; set; }
    public override bool Enabled { get; set; } = true;
    public override bool RequiresJS { get; set; }
    public List<WatchedPageChange> Changes { get; set; } = null!;
}