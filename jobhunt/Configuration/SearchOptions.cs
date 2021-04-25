namespace JobHunt.Configuration {
    public class SearchOptions {
        public const string Position = "Search";
        public string IndeedPublisherId { get; set; } = null!;
        public string GlassdoorPartnerId { get; set; } = null!;
        public string GlassdoorPartnerKey { get; set; } = null!;
    }
}