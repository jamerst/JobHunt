using System.Text.Json.Serialization;

using Refit;

namespace JobHunt.Geocoding;

[Headers("User-Agent: jamerst/JobHunt")]
public interface INominatimApi
{
    [Get("/search")]
    Task<ApiResponse<IEnumerable<Location>>> SearchAsync(GeocodeParams geocodeParams);
}

public class GeocodeParams
{
    [AliasAs("q")]
    public required string Query { get; set; }

    [AliasAs("countrycodes")]
    public string? CountryCodes { get; set; }

    [AliasAs("limit")]
    public int Limit { get; set; } = 10;

    [AliasAs("format")]
    public string Format => "jsonv2";
}

public class Location
{
    [JsonPropertyName("lat")]
    public string? Latitude { get; set; }
    [JsonPropertyName("lon")]
    public string? Longitude { get; set; }
}