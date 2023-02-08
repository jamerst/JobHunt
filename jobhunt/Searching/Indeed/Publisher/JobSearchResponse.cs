using System.Diagnostics;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace JobHunt.Searching.Indeed.Publisher;

public class JobSearchResponse
{
    public int TotalResults { get; set; }
    public required IEnumerable<PublisherJobResult> Results { get; set; }
}

public class PublisherJobResult
{
    public required string JobTitle { get; set; }

    public required string Company { get; set; }

    public required string FormattedLocation { get; set; }

    [JsonConverter(typeof(RFC1123DateTimeConverter))]
    public DateTime Date { get; set; }

    public required string Snippet { get; set; }

    public required string Url { get; set; }

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public required string JobKey { get; set; }

    public bool Sponsored { get; set; }

    public JobResult ToJobResult()
    {
        // get the hostname of the job view URL to allow creating link without tracking to correct domain
        // returns "https://uk.indeed.com" for a UK job
        string jobBaseUri = new Uri(Url).GetLeftPart(UriPartial.Authority);

        return new JobResult
        {
            Key = JobKey,
            Title = JobTitle,
            Url = $"{jobBaseUri}/viewjob?jk={JobKey}",
            HtmlDescription = Snippet,
            Location = FormattedLocation,
            Latitude = Latitude,
            Longitude = Longitude,
            EmployerName = Company,
            Posted = new DateTimeOffset(Date, TimeSpan.Zero),
            Attributes = Enumerable.Empty<string>(),
            FormattedSalary = null,
            AvgYearlySalary = null
        };
    }

    private class RFC1123DateTimeConverter : JsonConverter<DateTime>
    {
        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            Debug.Assert(typeToConvert == typeof(DateTime));
            return DateTime.ParseExact(reader.GetString()!, "r", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal);
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToString());
        }
    }
}