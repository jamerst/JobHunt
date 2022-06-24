namespace JobHunt.Models;
public class CompanyCategory
{
    public int CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
}