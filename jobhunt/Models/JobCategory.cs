namespace JobHunt.Models;
public class JobCategory
{
    [Required]
    public int JobId { get; set; }
    public Job Job { get; set; } = null!;
    [Required]
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
}