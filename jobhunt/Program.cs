using System.Globalization;
using System.Text.Json.Serialization;

using Microsoft.AspNetCore.OData;
using Microsoft.AspNetCore.SpaServices.ReactDevelopmentServer;

using Serilog;

using JobHunt.Filters;
using JobHunt.Workers;

var builder = WebApplication.CreateBuilder();

builder.Host.UseJobHuntSerilog();

builder.WebHost.UseKestrel(options => options.ListenAnyIP(5000));

var cultureInfo = new CultureInfo(builder.Configuration.GetValue<string>("CultureName"));
CultureInfo.DefaultThreadCurrentCulture = cultureInfo;
CultureInfo.DefaultThreadCurrentUICulture = cultureInfo;

builder.Host.ConfigureServices(services =>
{
    services.AddHostedService<SearchRefreshWorker>();
    services.AddHostedService<PageScreenshotWorker>();
});

builder.Services.AddCors(builder =>
{
    builder.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

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

    app.UseStaticFiles();
    app.UseSpaStaticFiles();

    app.UseRouting();

    app.UseCors();

    app.UseEndpoints(endpoints => endpoints.MapControllers());

    app.UseSpa(spa =>
    {
        spa.Options.SourcePath = "client";

        if (app.Environment.IsDevelopment())
        {
            spa.UseReactDevelopmentServer("start");
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