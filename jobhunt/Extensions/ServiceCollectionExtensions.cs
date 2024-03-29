using Microsoft.EntityFrameworkCore;

using Polly;
using Polly.Extensions.Http;
using Refit;
using Serilog;

using JobHunt.Geocoding;
using JobHunt.PageWatcher;
using JobHunt.Searching.Indeed;
using JobHunt.Searching.Indeed.GraphQL;
using JobHunt.Searching.Indeed.Publisher;
using JobHunt.Workers;

namespace JobHunt.Extensions;
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Add the core JobHunt services (DbContext, data services, HTTP clients and geocoder)
    /// </summary>
    public static IServiceCollection AddJobHuntCoreServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<JobHuntContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                o => o.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)
            )
        );

        services.Configure<ScreenshotOptions>(configuration.GetSection(ScreenshotOptions.Section));
        services.Configure<SearchOptions>(configuration.GetSection(SearchOptions.Section));

        services.AddHttpClient();

        services.AddScoped<IAlertService, AlertService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ICompanyService, CompanyService>();
        services.AddScoped<ICompanyCategoryService, CompanyCategoryService>();
        services.AddScoped<ICompanyNameService, CompanyNameService>();
        services.AddScoped<IJobService, JobService>();
        services.AddScoped<IJobCategoryService, JobCategoryService>();
        services.AddScoped<ISearchService, SearchService>();
        services.AddScoped<IWatchedPageService, WatchedPageService>();
        services.AddScoped<IWatchedPageChangeService, WatchedPageChangeService>();

        services.AddMemoryCache(); // memory cache used for caching geocoded locations
        services.AddRefitClient<INominatimApi>()
            .ConfigureHttpClient(c => c.BaseAddress = new Uri("https://nominatim.openstreetmap.org"));
        services.AddTransient<IGeocoder, Nominatim>();

        return services;
    }

    public static IServiceCollection AddIndeedApiSearchProvider(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IIndeedApiSearchProvider, IndeedApiSearchProvider>();

        var options = configuration.GetRequiredSection(SearchOptions.Section).Get<SearchOptions>();

        if (options != null)
        {
            if (options.Indeed.UseGraphQL && options.Indeed.CanUseGraphQL())
            {
                services.AddIndeedGraphQLApi();
            }
            else if (options.Indeed.CanUsePublisher())
            {
                services.AddIndeedPublisherApi(options.Indeed);
            }
        }

        return services;
    }

    public static IServiceCollection AddIndeedGraphQLApi(this IServiceCollection services)
    {
        services.AddScoped<IIndeedJobFetcher, IndeedGraphQLService>();
        services.AddScoped<IIndeedGraphQLService, IndeedGraphQLService>();

        return services;
    }

    public static IServiceCollection AddIndeedPublisherApi(this IServiceCollection services, IndeedOptions options)
    {
        var retryPolicy = HttpPolicyExtensions
            .HandleTransientHttpError()
            .WaitAndRetryAsync(
                5,
                attempt => TimeSpan.FromSeconds(attempt),
                (result, _, count, _) => Log.Warning(result.Exception, "HTTP request attempt {attempt} failed", count)
            );

        services.AddRefitClient<IIndeedPublisherApi>()
            .ConfigureHttpClient(c => c.BaseAddress = new Uri("https://api.indeed.com"))
            .AddPolicyHandler(retryPolicy);

        services.AddScoped<IIndeedSalaryApiFactory, IndeedSalaryApiFactory>();

        services.AddRefitClient<IIndeedJobDescriptionApi>()
            .ConfigureHttpClient(c => c.BaseAddress = new Uri("https://indeed.com"))
            .AddPolicyHandler(retryPolicy);

        if (options.UseGraphQLSalaryAndDescriptions && options.CanUseGraphQL())
        {
            services.AddScoped<IIndeedGraphQLService, IndeedGraphQLService>();
        }

        services.AddScoped<IIndeedJobFetcher, IndeedPublisherService>();

        return services;
    }

    public static IServiceCollection AddPageWatcher(this IServiceCollection services)
    {
        services.AddScoped<IPageWatcher, PageWatcher.PageWatcher>();

        return services;
    }

    public static IServiceCollection AddJobHuntWorkers(this IServiceCollection services)
    {
        services.AddScoped<IPageScreenshotWorker, PageScreenshotWorker>();
        services.AddScoped<ISearchRefreshWorker, SearchRefreshWorker>();

        return services;
    }
}