namespace JobHunt.Models {
    public class CompanyCategory {
        public string CompanyId { get; set; } = null!;
        public Company Company { get; set; } = null!;
        public string CategoryId { get; set; } = null!;
        public Category Category { get; set; } = null!;
    }
}