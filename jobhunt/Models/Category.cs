namespace JobHunt.Models;
public class Category
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public IList<CompanyCategory> CompanyCategories { get; set; } = null!;
    public IList<JobCategory> JobCategories { get; set; } = null!;
}