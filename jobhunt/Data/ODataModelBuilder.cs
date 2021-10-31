using Microsoft.OData.ModelBuilder;
using Microsoft.OData.Edm;

using JobHunt.Models;

namespace JobHunt.Data {
    public static class ODataModelBuilder {
        public static IEdmModel Build() {
            var builder = new ODataConventionModelBuilder();

            builder.EntitySet<Job>("Job").EntityType.HasKey(j => j.Id);
            builder.EntitySet<Company>("Company");

            return builder.GetEdmModel();
        }
    }
}