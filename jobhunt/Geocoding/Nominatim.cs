using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using JobHunt.Configuration;

namespace JobHunt.Geocoding {
    public class Nominatim : IGeocoder {
        private const string _searchUrl = "https://nominatim.openstreetmap.org/search";

        private readonly SearchOptions _options;
        private readonly ILogger _logger;
        private readonly HttpClient _client;
        private readonly IMemoryCache _cache;

        public Nominatim(IOptions<SearchOptions> options, ILogger<Nominatim> logger, HttpClient client, IMemoryCache cache) {
            _options = options.Value;
            _logger = logger;
            _client = client;
            _cache = cache;
        }

        public async Task<Coordinate?> GeocodeAsync(string location) {
            if (_cache.TryGetValue<Coordinate?>($"Nominatim.GeocodeAsync_{location.ToLower()}", out var result)) {
                return result;
            } else {
                Dictionary<string, string?> query = new Dictionary<string, string?>() {
                    { "q", location },
                    { "countrycodes", _options.NominatimCountryCodes },
                    { "limit", "1" },
                    { "format", "jsonv2" }
                };

                HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, QueryHelpers.AddQueryString(_searchUrl, query));
                request.Headers.UserAgent.Add(new ProductInfoHeaderValue("JobHunt", "1.0"));

                List<NominatimResponse>? response = null;
                using (var httpResponse = await _client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead)) {
                    string responseContent = await httpResponse.Content.ReadAsStringAsync();
                    if (httpResponse.IsSuccessStatusCode) {
                        response = JsonSerializer.Deserialize<List<NominatimResponse>>(responseContent);
                    } else {
                        _logger.LogError("Nominatim request failed. Received HTTP {StatusCode} with body {Content}", (int)httpResponse.StatusCode, responseContent);
                        return null;
                    }
                }

                if (response == null) {
                    _logger.LogError("Nominatim request deserialisation failed");
                    return null;
                }

                Coordinate? coord = null;
                if (double.TryParse(response.FirstOrDefault()?.Latitude, out double lat) && double.TryParse(response.FirstOrDefault()?.Longitude, out double lng)) {
                    coord = new Coordinate {
                        Latitude = lat,
                        Longitude = lng
                    };
                }

                _cache.Set($"Nominatim.GeocodeAsync_{location.ToLower()}", coord);
                return coord;
            }
        }

        private class NominatimResponse {
            [JsonPropertyName("lat")]
            public string? Latitude { get; set; }
            [JsonPropertyName("lon")]
            public string? Longitude { get; set; }
        }
    }
}