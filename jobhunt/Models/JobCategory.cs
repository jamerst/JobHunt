namespace JobHunt.Models {
    public class JobCategory {
        public string JobId { get; set; } = null!;
        public Job Job { get; set; } = null!;
        public string CategoryId { get; set; } = null!;
        public Category Category { get; set; } = null!;
    }
}