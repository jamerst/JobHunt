namespace JobHunt.Configuration;
public class ScreenshotOptions
{
    public const string Section = "Screenshots";

    public string? Schedule { get; set; }
    public required string Directory { get; set; }
    public int WidthPixels { get; set; }
    public int QualityPercent { get; set; }
    public int PageLoadTimeoutSeconds { get; set; }
}