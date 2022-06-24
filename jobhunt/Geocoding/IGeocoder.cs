namespace JobHunt.Geocoding;
public interface IGeocoder
{
    Task<Coordinate?> GeocodeAsync(string location);
}
