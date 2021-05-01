using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobHunt.Models {
    public class CompanyCareersPage {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public Company Company { get; set; } = null!;
        public string Url { get; set; } = null!;
        public string? Hash { get; set; }
        public string? CssSelector { get; set; }
        public string? CssBlacklist { get; set; }
        public DateTime? LastScraped { get; set; }
        public DateTime? LastUpdated { get; set; }
        public string? StatusMessage { get; set; }
    }
}