using System.Globalization;
using System.Text.Json.Serialization;

using Microsoft.AspNetCore.OData;

using AspNetCore.SpaServices.ViteDevelopmentServer;
using Serilog;

using JobHunt.Filters;
using JobHunt.Workers;

var builder = WebApplication.CreateBuilder();

builder.Host.UseJobHuntSerilog();

builder.WebHost.UseKestrel(options => options.ListenAnyIP(5000));

string? cultureName = builder.Configuration.GetValue<string>("CultureName");
if (!string.IsNullOrEmpty(cultureName))
{
    var cultureInfo = new CultureInfo(cultureName);
    CultureInfo.DefaultThreadCurrentCulture = cultureInfo;
    CultureInfo.DefaultThreadCurrentUICulture = cultureInfo;
}

builder.Services.AddHostedService<SearchRefreshWorker>();
builder.Services.AddHostedService<PageScreenshotWorker>();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(builder =>
    {
        builder.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
    });
}

builder.Services
    .AddControllers(options =>
    {
        options.Filters.Add(typeof(ExceptionLogger));
        options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
    })
    .AddJobHuntOData(builder.Configuration)
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddSpaStaticFiles(configuration => configuration.RootPath = "client/build");

builder.Services.AddJobHuntCoreServices(builder.Configuration);
builder.Services.AddIndeedApiSearchProvider();
builder.Services.AddPageWatcher();
builder.Services.AddJobHuntWorkers();

try
{
    Log.Information("Starting web host");

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        app.UseDeveloperExceptionPage();
        app.UseODataRouteDebug();
    }
    else
    {
        app.UseExceptionHandler("/Error");
    }

    app.UseODataBatching();

    app.UseStaticFiles();
    app.UseSpaStaticFiles();

    app.UseRouting();

    app.UseCors();

#pragma warning disable ASP0014 // Suggest using top level route registrations
    // disable warning - using app.MapControllers() breaks OData
    app.UseEndpoints(endpoints => endpoints.MapControllers());
#pragma warning restore ASP0014 // Suggest using top level route registrations

    app.UseSpa(spa =>
    {
        spa.Options.SourcePath = "client";

        if (app.Environment.IsDevelopment())
        {
            spa.Options.DevServerPort = 5001;
            spa.UseViteDevelopmentServer("start");
        }
    });

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
    return 1;
}
finally
{
    Log.CloseAndFlush();
}

return 0;