namespace JobHunt.Configuration {
    public class SearchOptions {
        public const string Position = "Search";
        public string IndeedPublisherId { get; set; } = null!;
        public string IndeedHostName { get; set; } = "indeed.com";
        public bool IndeedFetchSalary { get; set; }
        public string GlassdoorPartnerId { get; set; } = null!;
        public string GlassdoorPartnerKey { get; set; } = null!;
        public string[] Schedules { get; set; } = null!;
        public string? NominatimCountryCodes { get; set; }
    }
}