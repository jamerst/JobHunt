using System.ComponentModel.DataAnnotations.Schema;

namespace JobHunt.Models {
    public class CompanyName {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public Company Company { get; set; } = null!; 
        public string Name { get; set; } = null!;
    }
}