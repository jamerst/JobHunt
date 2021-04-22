using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobHunt.Models {
    public class Category {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public IList<CompanyCategory> CompanyCategories { get; set; } = null!;
        public IList<JobCategory> JobCategories { get; set; } = null!;
    }
}