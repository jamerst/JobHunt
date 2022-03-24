using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using JobHunt.Configuration;

namespace JobHunt.Geocoding {
    public class Nominatim : INominatim {
        private readonly SearchOptions _options;
        private readonly ILogger _logger;
        private readonly HttpClient _client;
        private const string _searchUrl = "https://nominatim.openstreetmap.org/search";
        public Nominatim(IOptions<SearchOptions> options, ILogger<Nominatim> logger, HttpClient client) {
            _options = options.Value;
            _logger = logger;
            _client = client;
        }
        public async Task<(double?, double?)> Geocode(string location) {
            Dictionary<string, string?> query = new Dictionary<string, string?>() {
                { "q", location },
                { "countrycodes", _options.NominatimCountryCodes },
                { "limit", "1" },
                { "format", "jsonv2" }
            };

            NominatimResponse[]? response = null;
            using (var httpResponse = await _client.GetAsync(QueryHelpers.AddQueryString(_searchUrl, query), HttpCompletionOption.ResponseHeadersRead)) {
                string responseContent = await httpResponse.Content.ReadAsStringAsync();
                if (httpResponse.IsSuccessStatusCode) {
                    response = JsonSerializer.Deserialize<NominatimResponse[]>(responseContent);
                } else {
                    _logger.LogError("Nominatim request failed {Response} {Content}", httpResponse, responseContent);
                    return (null, null);
                }
            }

            if (response == null) {
                _logger.LogError("Nominatim request deserialisation failed");
                return (null, null);
            }

            if (response.Length == 0) {
                return (null, null);
            }

            if (double.TryParse(response[0].Latitude, out double lat) && double.TryParse(response[0].Longitude, out double lng)) {
                return (lat, lng);
            } else {
                return (null, null);
            }
        }

        private class NominatimResponse {
            [JsonPropertyName("lat")]
            public string? Latitude { get; set; }
            [JsonPropertyName("lon")]
            public string? Longitude { get; set; }
        }
    }

    public interface INominatim : IGeocoder {}
}