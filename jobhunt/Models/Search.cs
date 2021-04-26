using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobHunt.Models {
    public class Search {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public string? Id { get; set; }
        public string Provider { get; set; } = null!;
        public string Query { get; set; } = null!;
        public string Country { get; set; } = null!;
        public string? Location { get; set; }
        public int? Distance { get; set; }
        public int? MaxAge { get; set; }
        public int? LastResultCount { get; set; }
        public bool? LastFetchSuccess { get; set; }
        public DateTime? LastRun { get; set; }
        public IList<Job> FoundJobs { get; set; } = null!;
    }
}