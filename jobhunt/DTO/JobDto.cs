using System;
using System.Collections.Generic;

namespace JobHunt.DTO {
    public class JobDto {
        public int? Id { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string? Salary { get; set; }
        public int? AvgYearlySalary { get; set; }
        public string? Url { get; set; }
        public string Location { get; set; } = null!;
        public int? CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public DateTime? Posted { get; set; }
        public string? Notes { get; set; }
        public IEnumerable<CategoryDto> Categories { get; set; } = new List<CategoryDto>();
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}