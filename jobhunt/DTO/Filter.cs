using System;
using System.Collections.Generic;

namespace JobHunt.DTO {
    public class Filter {
        public string? Term { get; set; }
        public string? Location { get; set; }
        public int? Distance { get; set; }
        public DateTime? Posted { get; set; }
        public List<int>? Categories { get; set; }
        public string? Status { get; set; }
        public bool? ShowArchived { get; set; }
        public bool? Recruiter { get; set; }
    }
}