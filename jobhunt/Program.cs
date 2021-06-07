using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

using JobHunt.Workers;

namespace JobHunt {
    public class Program {
        public static void Main(string[] args) {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder => {
                    webBuilder.UseKestrel(options => {
                        options.ListenAnyIP(5000);
                    });
                    webBuilder.UseStartup<Startup>();
                })
                .ConfigureServices(services => {
                services.AddHostedService<SearchRefreshWorker>();
                });
    }
}
