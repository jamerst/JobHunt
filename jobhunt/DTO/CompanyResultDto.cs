namespace JobHunt.DTO {
    public class CompanyResultDto {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Location { get; set; } = null!;
        public double? Distance { get; set; }
    }
}