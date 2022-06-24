using Microsoft.AspNetCore.OData;
using Microsoft.AspNetCore.OData.Routing.Conventions;
using Microsoft.AspNetCore.OData.Query.Expressions;

using JobHunt.Data.OData;

namespace JobHunt.Extensions;
public static class MvcBuilderExtensions
{
    public static IMvcBuilder AddJobHuntOData(this IMvcBuilder builder, IConfiguration configuration)
    {
        builder.AddOData(options =>
        {
            options.TimeZone = TimeZoneInfo.Utc;
            options.AddRouteComponents(
                "api/odata",
                ODataModelBuilder.Build(),
                // add custom binders for GeoDistance function
                s => s.AddJobHuntCoreServices(configuration) // not sure why the core services also need adding here
                    .AddScoped<IGeoFunctionBinder, GeoFunctionBinder>()
                    .AddScoped<IFilterBinder, CustomFilterBinder>()
                    .AddScoped<IOrderByBinder, CustomOrderByBinder>()
                    .AddScoped<ISelectExpandBinder, CustomSelectExpandBinder>()
            ).Conventions.Add(new MyConvention());

            options.Filter()
                .Select()
                .Expand()
                .Count()
                .OrderBy()
                .SkipToken()
                .SetMaxTop(500);
        });

        CustomUriFunctionUtils.AddCustomUriFunction(typeof(JobHuntContext).GetMethod(nameof(JobHuntContext.GeoDistance))!);
        CustomUriFunctionUtils.AddCustomUriFunction("geocode", typeof(double?), typeof(string), typeof(double), typeof(double));

        return builder;
    }

    public class MyConvention : IODataControllerActionConvention
    {
        /// <summary>
        /// Order value.
        /// </summary>
        public int Order => -100;

        /// <summary>
        /// Apply to action,.
        /// </summary>
        /// <param name="context">Http context.</param>
        /// <returns>true/false</returns>
        public bool AppliesToAction(ODataControllerActionContext context)
        {
            return true; // apply to all controller
        }

        /// <summary>
        /// Apply to controller
        /// </summary>
        /// <param name="context">Http context.</param>
        /// <returns>true/false</returns>
        public bool AppliesToController(ODataControllerActionContext context)
        {
            return false; // continue for all others
        }
    }
}