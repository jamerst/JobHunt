using Microsoft.EntityFrameworkCore;

using JobHunt.Models;
namespace JobHunt.Data {
    public class JobHuntContext : DbContext {
        public JobHuntContext(DbContextOptions options) : base(options) { }

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
                .WithOne(j => j.SearchSource!)
                .OnDelete(DeleteBehavior.SetNull);
        }

        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Company> Companies => Set<Company>();
        public DbSet<CompanyCategory> CompanyCategories => Set<CompanyCategory>();
        public DbSet<CompanyName> CompanyNames => Set<CompanyName>();
        public DbSet<Job> Jobs => Set<Job>();
        public DbSet<JobCategory> JobCategories => Set<JobCategory>();
        public DbSet<Search> Searches => Set<Search>();
    }
}