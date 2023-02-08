namespace JobHunt.Configuration;
public class SearchOptions
{
    public const string Section = "Search";

    public required IndeedOptions Indeed { get; set; }

    public required string[] Schedules { get; set; }

    public string? NominatimCountryCodes { get; set; }

    public int PageLoadWaitSeconds { get; set; }

    public bool CheckForDuplicateJobs { get; set; }
    public int? DuplicateCheckMonths { get; set; }
    public double DescriptionSimilarityThreshold { get; set; }
    public double TitleSimilarityThreshold { get; set; }
    public double IdenticalDescriptionSimilarityThreshold { get; set; }
}