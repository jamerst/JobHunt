namespace JobHunt.Models;
public class Alert
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public bool Read { get; set; }
    public required string Type { get; set; }
    public required string Title { get; set; }
    public string? Message { get; set; }
    public string? Url { get; set; }
    public DateTimeOffset Created { get; set; }
}