using System;

namespace JobHunt.Geocoding {
    public static class GeocodingUtils {
        public static double HaversineDistance(double lat1, double lng1, double lat2, double lng2) {
            var lat = (lat2 - lat1).ToRadians();
            var lng = (lng2 - lng1).ToRadians();
            var h1 = Math.Sin(lat / 2) * Math.Sin(lat / 2) +
                        Math.Cos(lat1.ToRadians()) * Math.Cos(lat2.ToRadians()) *
                        Math.Sin(lng / 2) * Math.Sin(lng / 2);
            var h2 = 2 * Math.Asin(Math.Min(1, Math.Sqrt(h1)));
            return 3960 * h2;
        }

        public static double ToRadians(this double val) {
            return (Math.PI / 180) * val;
        }
    }
}