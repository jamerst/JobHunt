using Microsoft.Extensions.Caching.Memory;

using Refit;

namespace JobHunt.Geocoding;
public class Nominatim : IGeocoder
{
    private readonly SearchOptions _options;
    private readonly ILogger _logger;
    private readonly INominatimApi _api;
    private readonly IMemoryCache _cache;

    public Nominatim(IOptions<SearchOptions> options, ILogger<Nominatim> logger, INominatimApi api, IMemoryCache cache)
    {
        _options = options.Value;
        _logger = logger;
        _api = api;
        _cache = cache;
    }

    public async Task<Coordinate?> GeocodeAsync(string location)
    {
        if (_cache.TryGetValue<Coordinate?>($"Nominatim.GeocodeAsync_{location.ToLower()}", out var result))
        {
            return result;
        }
        else
        {
            ApiResponse<IEnumerable<Location>> response;
            try
            {
                response = (await _api.SearchAsync(
                    new GeocodeParams
                    {
                        Query = location,
                        CountryCodes = _options.NominatimCountryCodes,
                        Limit = 1
                    })
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Nominatim request exception for {location}", location);
                return null;
            }

            Coordinate? coord = null;
            if (response.IsSuccessStatusCode && response.Content != null)
            {
                var nominatimResult = response.Content.FirstOrDefault();

                if (double.TryParse(nominatimResult?.Latitude, out double lat) && double.TryParse(nominatimResult?.Longitude, out double lng))
                {
                    coord = new Coordinate
                    {
                        Latitude = lat,
                        Longitude = lng
                    };
                }
            }
            else
            {
                _logger.LogError("Nominatim request failed {@response}", response);
            }

            _cache.Set($"Nominatim.GeocodeAsync_{location.ToLower()}", coord);
            return coord;
        }
    }
}