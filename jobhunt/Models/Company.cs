using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobHunt.Models {
    public class Company {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Location { get; set; } = null!;
        public string? Notes { get; set; }
        public IList<Job> Jobs { get; set; } = null!;
        public string? Website { get; set; }
        public string? CareersPage { get; set; }
        public string? CareersHash { get; set; }
        public string? CareersCssSelector { get; set; }
        public DateTime? CareersLastScraped { get; set; }
        public DateTime? CareersLastUpdated { get; set; }
        public short? Rating { get; set; }
        public string? Glassdoor { get; set; }
        public string? LinkedIn { get; set; }
        public string? Endole { get; set; }
        public IList<CompanyCategory> CompanyCategories { get; set; } = null!;
    }
}