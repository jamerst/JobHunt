using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace JobHunt.Data;
public class JobHuntContext : DbContext
{
    public JobHuntContext(DbContextOptions options) : base(options) { }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder) {
        // var loggerFactory = LoggerFactory.Create(builder => {
        //     builder
        //     .AddConsole((options) => { })
        //     .AddFilter((category, level) =>
        //         category == DbLoggerCategory.Database.Command.Name
        //         && level == LogLevel.Information);
        // });

        // optionsBuilder.UseLoggerFactory(loggerFactory);
        // optionsBuilder.EnableSensitiveDataLogging();

        // disable global query filter warning for related entries
        // without this a warning is thrown at every start for the JobCategories entity
        // I could add the filter to JobCategories as well, but this will cause a join every time JobCategories are queried
        // JobCategories are never queried directly anyway, so just disable the warning
        optionsBuilder.ConfigureWarnings(builder =>
            builder.Ignore(CoreEventId.PossibleIncorrectRequiredNavigationWithQueryFilterInteractionWarning)
        );
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        #region Category
        builder.Entity<Category>()
            .HasMany(c => c.CompanyCategories)
            .WithOne(cc => cc.Category)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Category>()
            .HasMany(c => c.JobCategories)
            .WithOne(jc => jc.Category)
            .OnDelete(DeleteBehavior.Cascade);
        #endregion

        #region Company
        builder.Entity<Company>()
            .HasMany(c => c.AlternateNames)
            .WithOne(cn => cn.Company)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Company>()
            .HasMany(c => c.Jobs)
            .WithOne(c => c.Company!)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Company>()
            .HasMany<Job>()
            .WithOne(j => j.ActualCompany)
            .OnDelete(DeleteBehavior.SetNull);

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
        #endregion

        #region Job
        builder.Entity<Job>()
            .HasMany(j => j.JobCategories)
            .WithOne(jc => jc.Job)
            .OnDelete(DeleteBehavior.Cascade);

        // indexes for faster similarity searching
        builder.Entity<Job>()
            .HasIndex(j => j.Title)
            .HasMethod("gin")
            .HasOperators("gin_trgm_ops");

        builder.Entity<Job>()
            .HasIndex(j => j.Description)
            .HasMethod("gin")
            .HasOperators("gin_trgm_ops");

        builder.Entity<Job>()
            .HasQueryFilter(j => !j.Deleted);

        builder.Entity<JobCategory>()
            .HasKey(jc => new { jc.JobId, jc.CategoryId });
        #endregion

        #region Search
        builder.Entity<Search>()
            .HasMany(s => s.FoundJobs)
            .WithOne(j => j.Source!)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Search>()
            .HasMany(s => s.Runs)
            .WithOne(sr => sr.Search)
            .OnDelete(DeleteBehavior.Cascade);
        #endregion

        builder.Entity<WatchedPage>()
            .HasMany(p => p.Changes)
            .WithOne(c => c.WatchedPage)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasDbFunction(
            typeof(JobHuntContext)
            .GetMethod(nameof(GeoDistance),
                new[] { typeof(double), typeof(double), typeof(double), typeof(double) }
            )!
        ).HasName("geodistance");

        // add trigram extension to allow computing string similarity to find duplicate jobs
        builder.HasPostgresExtension("pg_trgm");
    }

    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<CompanyCategory> CompanyCategories => Set<CompanyCategory>();
    public DbSet<CompanyName> CompanyNames => Set<CompanyName>();
    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<JobCategory> JobCategories => Set<JobCategory>();
    public DbSet<Search> Searches => Set<Search>();
    public DbSet<SearchRun> SearchRuns => Set<SearchRun>();
    public DbSet<WatchedPage> WatchedPages => Set<WatchedPage>();
    public DbSet<WatchedPageChange> WatchedPageChanges => Set<WatchedPageChange>();
    public double GeoDistance(double alat, double alng, double blat, double blng) => throw new NotSupportedException();
}

// this is needed because the migration CLI doesn't work otherwise
// IConfiguration is null in such cases, so we can't use the method in AddJobHuntCoreServices like is used at runtime
public class JobHuntContextFactory : IDesignTimeDbContextFactory<JobHuntContext>
{
    public JobHuntContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<JobHuntContext>();

        IConfiguration config = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json", false, true)
            .Build();

        optionsBuilder.UseNpgsql(
            config.GetConnectionString("DefaultConnection"),
            o => o.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)
        );

        return new JobHuntContext(optionsBuilder.Options);
    }
}