namespace JobHunt.Models;
public class CompanyCategory
{
    [Required]
    public int CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    [Required]
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
}