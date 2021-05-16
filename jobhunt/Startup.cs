using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.AspNetCore.SpaServices.ReactDevelopmentServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

using JobHunt.Configuration;
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

            services.AddDbContext<Data.JobHuntContext>(options =>
                options.UseNpgsql(Configuration.GetConnectionString("DefaultConnection"))
                // .EnableSensitiveDataLogging()
            );

            services.AddControllers();

            // In production, the React files will be served from this directory
            services.AddSpaStaticFiles(configuration => {
                configuration.RootPath = "client/build";
            });
            services.Configure<SearchOptions>(Configuration.GetSection(SearchOptions.Position));

            services.AddTransient<IAlertService, AlertService>();
            services.AddTransient<ICompanyService, CompanyService>();
            services.AddTransient<IJobService, JobService>();
            services.AddTransient<ISearchService, SearchService>();
            services.AddTransient<IWatchedPageService, WatchedPageService>();

            services.AddTransient<IIndeedAPI, IndeedAPI>();
            services.AddTransient<IPageWatcher, PageWatcher>();

            services.AddTransient<INominatim, Nominatim>();

            services.AddHostedService<SearchRefreshWorker>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env) {
            if (env.IsDevelopment()) {
                app.UseDeveloperExceptionPage();
            } else {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseSpaStaticFiles();

            app.UseRouting();

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
