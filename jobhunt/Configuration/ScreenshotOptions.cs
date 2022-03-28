namespace JobHunt.Configuration {
    public class ScreenshotOptions {
        public const string Section = "Screenshots";

        public string? Schedule { get; set; }
        public string Directory { get; set; } = null!;
        public int WidthPixels { get; set; }
        public int QualityPercent { get; set; }
        public int PageLoadTimeoutSeconds { get; set; }
    }
}