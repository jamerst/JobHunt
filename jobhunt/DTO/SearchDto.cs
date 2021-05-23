namespace JobHunt.DTO {
    public class SearchDto {
        public int? Id { get; set; } = null;
        public string Provider { get; set; } = null!;
        public string Query { get; set; } = null!;
        public string Country { get; set; } = null!;
        public string? Location { get; set; }
        public int? Distance { get; set; }
        public int? MaxAge { get; set; }
        public bool Enabled { get; set; }
        public bool EmployerOnly { get; set; }
        public string? JobType { get; set; }
    }
}