using System;
using System.Collections.Generic;

namespace JobHunt.DTO {
    public class NewJobDto {
        public string Title { get; set; } = null!;
        public string? Location { get; set; }
        public string? Description { get; set; }
        public string? Salary { get; set; }
        public int? AvgYearlySalary { get; set; }
        public string? Url { get; set; }
        public int? CompanyId { get; set; }
        public DateTime? Posted { get; set; }
    }
}