using System;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using JobHunt.Models;
namespace JobHunt.Data {
    public class JobHuntContext : DbContext {
        public JobHuntContext(DbContextOptions options) : base(options) { }

        // protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder) {
        //     var loggerFactory = LoggerFactory.Create(builder => {
        //         builder
        //         .AddConsole((options) => { })
        //         .AddFilter((category, level) =>
        //             category == DbLoggerCategory.Database.Command.Name
        //             && level == LogLevel.Information);
        //     });

        //     optionsBuilder.UseLoggerFactory(loggerFactory);
        // }

        protected override void OnModelCreating(ModelBuilder builder) {
            base.OnModelCreating(builder);

            builder.Entity<Category>()
                .HasMany(c => c.CompanyCategories)
                .WithOne(cc => cc.Category)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Category>()
                .HasMany(c => c.JobCategories)
                .WithOne(jc => jc.Category)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Company>()
                .HasMany(c => c.AlternateNames)
                .WithOne(cn => cn.Company)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Company>()
                .HasMany(c => c.Jobs)
                .WithOne(c => c.Company!)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Company>()
                .HasMany(c => c.WatchedPages)
                .WithOne(cc => cc.Company)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Company>()
                .HasMany(c => c.CompanyCategories)
                .WithOne(cc => cc.Company)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<CompanyCategory>()
                .HasKey(cc => new { cc.CompanyId, cc.CategoryId });

            builder.Entity<CompanyName>()
                .HasKey(cn => new { cn.CompanyId, cn.Name });

            builder.Entity<Job>()
                .HasMany(j => j.JobCategories)
                .WithOne(jc => jc.Job)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<JobCategory>()
                .HasKey(jc => new { jc.JobId, jc.CategoryId });

            builder.Entity<Search>()
                .HasMany(s => s.FoundJobs)
                .WithOne(j => j.Source!)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<Search>()
                .HasMany(s => s.Runs)
                .WithOne(sr => sr.Search)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasDbFunction(
                typeof(JobHuntContext)
                .GetMethod(nameof(GeoDistance),
                    new[] { typeof(double), typeof(double), typeof(double), typeof(double) }
                )!
            ).HasName("geodistance");
        }

        public DbSet<Alert> Alerts => Set<Alert>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Company> Companies => Set<Company>();
        public DbSet<WatchedPage> WatchedPages => Set<WatchedPage>();
        public DbSet<CompanyCategory> CompanyCategories => Set<CompanyCategory>();
        public DbSet<CompanyName> CompanyNames => Set<CompanyName>();
        public DbSet<Job> Jobs => Set<Job>();
        public DbSet<JobCategory> JobCategories => Set<JobCategory>();
        public DbSet<Search> Searches => Set<Search>();
        public DbSet<SearchRun> SearchRuns => Set<SearchRun>();
        public double GeoDistance(double alat, double alng, double blat, double blng) => throw new NotSupportedException();
    }
}