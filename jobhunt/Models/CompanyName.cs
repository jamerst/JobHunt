using System.ComponentModel.DataAnnotations.Schema;

namespace JobHunt.Models {
    public class CompanyName {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public string Id { get; set; } = null!;
        public string CompanyId { get; set; } = null!;
        public Company Company { get; set; } = null!; 
        public string Name { get; set; } = null!;
    }
}