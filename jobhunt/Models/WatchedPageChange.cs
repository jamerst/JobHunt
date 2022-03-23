using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobHunt.Models {
    public class WatchedPageChange {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public int WatchedPageId { get; set; }
        public WatchedPage WatchedPage { get; set; } = null!;
        public DateTime Created { get; set; }
        public string Html { get; set; } = null!;
        public string? ScreenshotFileName { get; set; }
    }
}