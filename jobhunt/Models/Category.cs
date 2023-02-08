namespace JobHunt.Models;
public class Category : KeyedEntity
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public required string Name { get; set; }
    public IList<CompanyCategory> CompanyCategories { get; set; } = null!;
    public IList<JobCategory> JobCategories { get; set; } = null!;
}