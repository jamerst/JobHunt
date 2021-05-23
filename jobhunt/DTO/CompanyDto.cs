using System.Collections.Generic;
namespace JobHunt.DTO {
    public class CompanyDto {
        public int? Id { get; set; }
        public string Name { get; set; } = null!;
        public string Location { get; set; } = null!;
        public string? Notes { get; set; }
        public bool Watched { get; set; }
        public bool Blacklisted { get; set; }
        public string? Website { get; set; }
        public short? Rating { get; set; }
        public string? Glassdoor { get; set; }
        public string? LinkedIn { get; set; }
        public string? Endole { get; set; }
        public IEnumerable<WatchedPageDto> WatchedPages { get; set; } = new List<WatchedPageDto>();
        public IEnumerable<CategoryDto> Categories { get; set; } = new List<CategoryDto>();
        public IEnumerable<string> AlternateNames { get; set; } = new List<string>();
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}