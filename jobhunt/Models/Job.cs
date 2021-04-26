using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace JobHunt.Models {
    public class Job {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public string Id { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string? Salary { get; set; }
        public string Location { get; set; } = null!;
        public string? Url { get; set; }
        public string? CompanyId { get; set; }
        public Company? Company { get; set; }
        public DateTime? Posted { get; set; }
        public string? Notes { get; set; }
        public bool Archived { get; set; } = false;
        public string Status { get; set; } = JobStatus.NotApplied;
        public DateTime? DateApplied { get; set; }
        public IList<JobCategory> JobCategories { get; set; } = null!;
        public string? Provider { get; set; }
        public string? ProviderId { get; set; }
        public string? SourceId { get; set; }
        public Search? Source { get; set; }
    }
}