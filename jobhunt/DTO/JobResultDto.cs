namespace JobHunt.DTO;
public class JobResultDto
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string Location { get; set; } = null!;
    public int? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public DateTime? Posted { get; set; }
    public bool Seen { get; set; }
    public bool Archived { get; set; }
    public double? Distance { get; set; }
}