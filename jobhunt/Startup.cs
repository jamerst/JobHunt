using System;
using System.Globalization;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.AspNetCore.SpaServices.ReactDevelopmentServer;
using Microsoft.AspNetCore.OData;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

using Polly;
using Polly.Extensions.Http;
using Serilog;

using JobHunt.Configuration;
using JobHunt.Data;
using JobHunt.Extensions;
using JobHunt.Filters;
using JobHunt.Geocoding;
using JobHunt.Searching;
using JobHunt.Services;
using JobHunt.Workers;
namespace JobHunt {
    public class Startup {
        public Startup(IConfiguration configuration) {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services) {

            services.AddDbContext<JobHuntContext>(options =>
                options.UseNpgsql(
                    Configuration.GetConnectionString("DefaultConnection"),
                    o => o.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)
                )
                // .EnableSensitiveDataLogging()
            );

            // services.AddCors(builder => {
            //     builder.AddDefaultPolicy(policy =>
            //         policy
            //             .WithOrigins("http://localhost:8080")
            //             .AllowAnyHeader()
            //             .AllowAnyMethod()
            //     );
            // });

            services.AddControllers(options => {
                    options.Filters.Add(typeof(ExceptionLogger));
                })
                .AddOData(options => {
                    options.TimeZone = TimeZoneInfo.Utc;
                    options.AddRouteComponents("api/odata", ODataModelBuilder.Build())
                        .Filter()
                        .Select()
                        .Expand()
                        .Count()
                        .OrderBy()
                        .SkipToken()
                        .SetMaxTop(500);
                });

            // In production, the React files will be served from this directory
            services.AddSpaStaticFiles(configuration => {
                configuration.RootPath = "client/build";
            });

            services.Configure<ScreenshotOptions>(Configuration.GetSection(ScreenshotOptions.Section));
            services.Configure<SearchOptions>(Configuration.GetSection(SearchOptions.Section));

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

            services.AddHttpClient<INominatim, Nominatim>((_, client) => client.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("JobHunt", "1.0")));

            services.AddTransient<IAlertService, AlertService>();
            services.AddTransient<ICategoryService, CategoryService>();
            services.AddTransient<ICompanyService, CompanyService>();
            services.AddTransient<IJobService, JobService>();
            services.AddTransient<ISearchService, SearchService>();
            services.AddTransient<IWatchedPageService, WatchedPageService>();
            services.AddTransient<IWatchedPageChangeService, WatchedPageChangeService>();

            services.AddTransient<IIndeedAPI, IndeedAPI>();
            services.AddTransient<IPageWatcher, PageWatcher>();

            services.AddTransient<INominatim, Nominatim>();

            services.AddTransient<IPageScreenshotWorker, PageScreenshotWorker>();
            services.AddTransient<ISearchRefreshWorker, SearchRefreshWorker>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env) {
            var cultureInfo = new CultureInfo(Configuration.GetValue<string>("CultureName"));
            CultureInfo.DefaultThreadCurrentCulture = cultureInfo;
            CultureInfo.DefaultThreadCurrentUICulture = cultureInfo;

            if (env.IsDevelopment()) {
                app.UseDeveloperExceptionPage();
            } else {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                // app.UseHsts();
            }

            // app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseSpaStaticFiles();

            app.UseRouting();

            // app.UseCors();

            app.UseEndpoints(endpoints => {
                endpoints.MapControllers();
            });

            app.UseSpa(spa => {
                spa.Options.SourcePath = "client";

                if (env.IsDevelopment()) {
                    spa.UseReactDevelopmentServer(npmScript: "start");
                }
            });
        }
    }
}
