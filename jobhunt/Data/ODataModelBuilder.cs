using Microsoft.OData.ModelBuilder;
using Microsoft.OData.Edm;

using JobHunt.Extensions;
using JobHunt.Models;
namespace JobHunt.Data {
    public static class ODataModelBuilder {
        public static IEdmModel Build() {
            var builder = new ODataConventionModelBuilder();

            builder.EntitySet<Job>("Job");

            builder.EntitySet<Company>("Company");

            builder.EntitySet<Search>("search");
            builder.AddUnmappedProperty<Search>(s => s.DisplayName);

            return builder.GetEdmModel();
        }
    }
}