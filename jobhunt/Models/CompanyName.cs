namespace JobHunt.Models;
public class CompanyName : KeyedEntity
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public required string Name { get; set; }
}