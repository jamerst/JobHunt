using System;

namespace JobHunt.DTO {
    public class Job {
        public string? Id { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string? Salary { get; set; }
        public string Location { get; set; } = null!;
        public string? Url { get; set; }
        public string? CompanyId { get; set; }
        public DateTime? Posted { get; set; }
        public string? Provider { get; set; }
        public string? ProviderId { get; set; }
        public string? SourceId { get; set; }
    }
}