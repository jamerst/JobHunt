namespace JobHunt.Configuration {
    public class SearchOptions  {
        public const string Section = "Search";

        public string IndeedPublisherId { get; set; } = null!;
        public bool IndeedFetchSalary { get; set; }
        public string GlassdoorPartnerId { get; set; } = null!;
        public string GlassdoorPartnerKey { get; set; } = null!;
        public string[] Schedules { get; set; } = null!;
        public string? NominatimCountryCodes { get; set; }
        public int PageLoadWaitSeconds { get; set; }
    }
}