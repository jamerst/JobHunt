namespace JobHunt.Models;
public class JobCategory
{
    public int JobId { get; set; }
    public Job Job { get; set; } = null!;
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
}