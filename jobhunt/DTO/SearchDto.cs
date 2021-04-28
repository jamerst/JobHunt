namespace JobHunt.DTO {
    public class SearchDto {
        public string? SearchId { get; set; } = null;
        public string Query { get; set; } = null!;
        public string Country { get; set; } = null!;
        public string? Location { get; set; }
        public int? Distance { get; set; }
        public int? MaxAge { get; set; }
    }
}