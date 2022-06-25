using Microsoft.OData.ModelBuilder;
using Microsoft.OData.Edm;
namespace JobHunt.Data;
public static class ODataModelBuilder
{
    public static IEdmModel Build()
    {
        var builder = new ODataConventionModelBuilder();

        builder.EntitySet<Job>(nameof(Job));

        builder.EntitySet<Company>(nameof(Company));

        builder.EntitySet<Search>(nameof(Search));
        builder.AddUnmappedProperty<Search>(s => s.DisplayName);

        return builder.GetEdmModel();
    }
}