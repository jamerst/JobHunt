using System.Threading.Tasks;

namespace JobHunt.Geocoding {
    public interface IGeocoder {
        Task<(double?, double?)> GeocodeAsync(string location);
    }
}