namespace JobHunt.Configuration {
    public class SearchOptions {
        public const string Position = "Search";
        public string IndeedPublisherId { get; set; } = null!;
        public bool IndeedFetchSalary { get; set; }
        public string GlassdoorPartnerId { get; set; } = null!;
        public string GlassdoorPartnerKey { get; set; } = null!;
        public string[] Schedules { get; set; } = null!;
        public string? NominatimCountryCodes { get; set; }
        public string? ScreenshotSchedule { get; set; }
        public string ScreenshotDirectory { get; set; } = null!;
        public int ScreenshotQuality { get; set; }
    }
}