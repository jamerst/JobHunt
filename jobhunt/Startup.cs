using System.Globalization;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SpaServices.ReactDevelopmentServer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

using JobHunt.Data;
using JobHunt.Data.OData;
using JobHunt.Extensions;
using JobHunt.Filters;
namespace JobHunt {
    public class Startup {
        public Startup(IConfiguration configuration) {
            _configuration = configuration;
        }

        public IConfiguration _configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services) {

            // services.AddCors(builder => {
            //     builder.AddDefaultPolicy(policy =>
            //         policy
            //             .WithOrigins("http://localhost:8080")
            //             .AllowAnyHeader()
            //             .AllowAnyMethod()
            //     );
            // });

            services
                .AddControllers(options => {
                    options.Filters.Add(typeof(ExceptionLogger));
                })
                .AddJobHuntOData(_configuration)
                .AddJsonOptions(options => {
                    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
                });

            // In production, the React files will be served from this directory
            services.AddSpaStaticFiles(configuration => {
                configuration.RootPath = "client/build";
            });

            services.AddJobHuntCoreServices(_configuration);
            services.AddJobHuntSearching();
            services.AddJobHuntWorkers();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env) {
            var cultureInfo = new CultureInfo(_configuration.GetValue<string>("CultureName"));
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
