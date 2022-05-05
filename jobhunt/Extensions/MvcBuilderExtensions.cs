using System;

using Microsoft.AspNetCore.OData;
using Microsoft.AspNetCore.OData.Query.Expressions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Caching.Memory;

using JobHunt.Data;
using JobHunt.Data.OData;

namespace JobHunt.Extensions {
    public static class MvcBuilderExtensions {
        public static IMvcBuilder AddJobHuntOData(this IMvcBuilder builder, IConfiguration configuration) {
            builder.AddOData(options => {
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
                );

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
    }
}