namespace JobHunt.Configuration;
public class SearchOptions
{
    public const string Section = "Search";

    public string IndeedPublisherId { get; set; } = null!;
    public bool IndeedFetchSalary { get; set; }
    public string IndeedGraphQLApiKey { get; set; } = null!;
    public string GlassdoorPartnerId { get; set; } = null!;
    public string GlassdoorPartnerKey { get; set; } = null!;
    public string[] Schedules { get; set; } = null!;
    public string? NominatimCountryCodes { get; set; }
    public int PageLoadWaitSeconds { get; set; }
    public bool CheckForDuplicateJobs { get; set; }
    public int? DuplicateCheckMonths { get; set; }
    public double DescriptionSimilarityThreshold { get; set; }
    public double TitleSimilarityThreshold { get; set; }
    public double IdenticalDescriptionSimilarityThreshold { get; set; }
}