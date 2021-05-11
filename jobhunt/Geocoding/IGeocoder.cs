using System.Threading.Tasks;

namespace JobHunt.Geocoding {
    public interface IGeocoder {
        Task<(double?, double?)> Geocode(string location);
    }
}