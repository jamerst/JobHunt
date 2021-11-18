using System.Linq;
using Microsoft.OData.ModelBuilder;
using Microsoft.OData.Edm;

using JobHunt.Models;

namespace JobHunt.Data {
    public static class ODataModelBuilder {
        public static IEdmModel Build() {
            var builder = new ODataConventionModelBuilder();

            builder.EntitySet<Job>("Job");
            builder.EntitySet<Company>("Company");

            builder.EntityType<Search>();
            builder.StructuralTypes.First(t => t.ClrType == typeof(Search)).AddProperty(typeof(Search).GetProperty(nameof(Search.DisplayName)));

            return builder.GetEdmModel();
        }
    }
}