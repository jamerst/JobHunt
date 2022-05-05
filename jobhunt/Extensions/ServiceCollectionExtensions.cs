using System;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Polly;
using Polly.Extensions.Http;
using Serilog;

using JobHunt.Configuration;
using JobHunt.Data;
using JobHunt.Geocoding;
using JobHunt.Services;
using JobHunt.Searching;
using JobHunt.Workers;

namespace JobHunt.Extensions {
    public static class ServiceCollectionExtensions {
        /// <summary>
        /// Add the core JobHunt services (DbContext, data services, HTTP clients and geocoder)
        /// </summary>
        public static IServiceCollection AddJobHuntCoreServices(this IServiceCollection services, IConfiguration configuration) {
            services.AddDbContext<JobHuntContext>(options =>
                options.UseNpgsql(
                    configuration.GetConnectionString("DefaultConnection"),
                    o => o.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)
                )
                // .EnableSensitiveDataLogging()
            );

            services.Configure<ScreenshotOptions>(configuration.GetSection(ScreenshotOptions.Section));
            services.Configure<SearchOptions>(configuration.GetSection(SearchOptions.Section));

            services.AddHttpClient();

            // retry requests on fail for Indeed requests - getting increased request failures recently
            var retryPolicy = HttpPolicyExtensions
                .HandleTransientHttpError()
                .WaitAndRetryAsync(
                    5,
                    attempt => TimeSpan.FromSeconds(attempt),
                    (result, _, count, _) => Log.Logger.Warning($"HTTP Request failed, retrying for {count.ToOrdinalString()} time", result.Exception)
                );
            services.AddHttpClient<IIndeedAPI, IndeedAPI>().AddPolicyHandler(retryPolicy);

            services.AddScoped<IAlertService, AlertService>();
            services.AddScoped<ICategoryService, CategoryService>();
            services.AddScoped<ICompanyService, CompanyService>();
            services.AddScoped<IJobService, JobService>();
            services.AddScoped<ISearchService, SearchService>();
            services.AddScoped<IWatchedPageService, WatchedPageService>();
            services.AddScoped<IWatchedPageChangeService, WatchedPageChangeService>();

            services.AddMemoryCache(); // memory cache used for caching geocoded locations
            services.AddTransient<IGeocoder, Nominatim>();

            return services;
        }

        public static IServiceCollection AddJobHuntSearching(this IServiceCollection services) {
            services.AddScoped<IIndeedAPI, IndeedAPI>();
            services.AddScoped<IPageWatcher, PageWatcher>();

            return services;
        }

        public static IServiceCollection AddJobHuntWorkers(this IServiceCollection services) {
            services.AddScoped<IPageScreenshotWorker, PageScreenshotWorker>();
            services.AddScoped<ISearchRefreshWorker, SearchRefreshWorker>();

            return services;
        }
    }
}