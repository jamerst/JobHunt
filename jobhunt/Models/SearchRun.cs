using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobHunt.Models {
    public class SearchRun {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public string? Id { get; set; }
        public string SearchId { get; set; } = null!;
        public Search Search { get; set; } = null!;
        public DateTime Time { get; set; }
        public bool Success { get; set; }
        public string? Message { get; set; }
        public int NewJobs { get; set; }
        public int NewCompanies { get; set; }
        public int TimeTaken { get; set; }
    }
}