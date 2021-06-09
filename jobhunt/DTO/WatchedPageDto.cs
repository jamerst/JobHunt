using System;

namespace JobHunt.DTO {
    public class WatchedPageDto : WatchedPageBase {
        public override string Url { get; set; } = null!;
        public override string? CssSelector { get; set; }
        public override string? CssBlacklist { get; set; }
        public DateTime? LastScraped { get; set; }
        public DateTime? LastUpdated { get; set; }
        public string? StatusMessage { get; set; }
        public bool Enabled { get; set; }
    }
}