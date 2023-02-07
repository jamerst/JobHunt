using System.Diagnostics;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace JobHunt.Searching.Indeed.Publisher;

public class JobSearchResponse
{
    public int TotalResults { get; set; }
    public IEnumerable<JobResult> Results { get; set; } = null!;
}

public class JobResult
{
    public string JobTitle { get; set; } = null!;

    public string Company { get; set; } = null!;

    public string FormattedLocation { get; set; } = null!;

    [JsonConverter(typeof(RFC1123DateTimeConverter))]
    public DateTime Date { get; set; }

    public string Snippet { get; set; } = null!;

    public string Url { get; set; } = null!;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public string JobKey { get; set; } = null!;

    public bool Sponsored { get; set; }

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