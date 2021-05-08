using System;

namespace JobHunt.DTO {
    public class CompanyCareersPageDto {
        public string Url { get; set; } = null!;
        public string? Hash { get; set; }
        public string? CssSelector { get; set; }
        public string? CssBlacklist { get; set; }
        public DateTime? LastScraped { get; set; }
        public DateTime? LastUpdated { get; set; }
        public string? StatusMessage { get; set; }
    }
}