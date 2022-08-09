using Microsoft.OData.ModelBuilder;
using Microsoft.OData.Edm;

namespace JobHunt.Data.OData;
public static class ODataModelBuilder
{
    public static IEdmModel Build()
    {
        var builder = new ODataConventionModelBuilder();
        builder.EnableLowerCamelCase();

        builder.EntitySet<Job>(nameof(Job));
        builder.EntitySet<JobCategory>(nameof(JobCategory));
        builder.EntityType<JobCategory>()
            .HasKey(jc => new { jc.CategoryId, jc.JobId });

        builder.EntitySet<Company>(nameof(Company));
        builder.EntitySet<CompanyCategory>(nameof(CompanyCategory));
        builder.EntityType<CompanyCategory>()
            .HasKey(cc => new { cc.CategoryId, cc.CompanyId });
        builder.EntitySet<CompanyName>(nameof(CompanyName));

        builder.EntitySet<Search>(nameof(Search));
        builder.AddUnmappedProperty<Search>(s => s.DisplayName);

        return builder.GetEdmModel();
    }
}