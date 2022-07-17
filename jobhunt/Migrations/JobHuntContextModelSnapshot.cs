﻿// <auto-generated />
using System;
using JobHunt.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace JobHunt.Migrations
{
    [DbContext(typeof(JobHuntContext))]
    partial class JobHuntContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "6.0.6")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            NpgsqlModelBuilderExtensions.HasPostgresExtension(modelBuilder, "pg_trgm");
            NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

            modelBuilder.Entity("JobHunt.Models.Alert", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<DateTime>("Created")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Message")
                        .HasColumnType("text");

                    b.Property<bool>("Read")
                        .HasColumnType("boolean");

                    b.Property<string>("Title")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Type")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Url")
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.ToTable("Alerts");
                });

            modelBuilder.Entity("JobHunt.Models.Category", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.ToTable("Categories");
                });

            modelBuilder.Entity("JobHunt.Models.Company", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<bool>("Blacklisted")
                        .HasColumnType("boolean");

                    b.Property<string>("Endole")
                        .HasColumnType("text");

                    b.Property<string>("Glassdoor")
                        .HasColumnType("text");

                    b.Property<string>("GlassdoorId")
                        .HasColumnType("text");

                    b.Property<float?>("GlassdoorRating")
                        .HasColumnType("real");

                    b.Property<double?>("Latitude")
                        .HasColumnType("double precision");

                    b.Property<string>("LinkedIn")
                        .HasColumnType("text");

                    b.Property<string>("Location")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<double?>("Longitude")
                        .HasColumnType("double precision");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Notes")
                        .HasColumnType("text");

                    b.Property<short?>("Rating")
                        .HasColumnType("smallint");

                    b.Property<bool>("Recruiter")
                        .HasColumnType("boolean");

                    b.Property<bool>("Watched")
                        .HasColumnType("boolean");

                    b.Property<string>("Website")
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.ToTable("Companies");
                });

            modelBuilder.Entity("JobHunt.Models.CompanyCategory", b =>
                {
                    b.Property<int>("CompanyId")
                        .HasColumnType("integer");

                    b.Property<int>("CategoryId")
                        .HasColumnType("integer");

                    b.HasKey("CompanyId", "CategoryId");

                    b.HasIndex("CategoryId");

                    b.ToTable("CompanyCategories");
                });

            modelBuilder.Entity("JobHunt.Models.CompanyName", b =>
                {
                    b.Property<int>("CompanyId")
                        .HasColumnType("integer");

                    b.Property<string>("Name")
                        .HasColumnType("text");

                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.HasKey("CompanyId", "Name");

                    b.ToTable("CompanyNames");
                });

            modelBuilder.Entity("JobHunt.Models.Job", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<int?>("ActualCompanyId")
                        .HasColumnType("integer");

                    b.Property<bool>("Archived")
                        .HasColumnType("boolean");

                    b.Property<int?>("AvgYearlySalary")
                        .HasColumnType("integer");

                    b.Property<int?>("CompanyId")
                        .HasColumnType("integer");

                    b.Property<DateTime?>("DateApplied")
                        .HasColumnType("timestamp with time zone");

                    b.Property<bool>("Deleted")
                        .HasColumnType("boolean");

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int?>("DuplicateJobId")
                        .HasColumnType("integer");

                    b.Property<double?>("Latitude")
                        .HasColumnType("double precision");

                    b.Property<string>("Location")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<double?>("Longitude")
                        .HasColumnType("double precision");

                    b.Property<string>("Notes")
                        .HasColumnType("text");

                    b.Property<DateTime?>("Posted")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Provider")
                        .HasColumnType("text");

                    b.Property<string>("ProviderId")
                        .HasColumnType("text");

                    b.Property<string>("Salary")
                        .HasColumnType("text");

                    b.Property<bool>("Seen")
                        .HasColumnType("boolean");

                    b.Property<int?>("SourceId")
                        .HasColumnType("integer");

                    b.Property<string>("Status")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Title")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Url")
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("ActualCompanyId");

                    b.HasIndex("CompanyId");

                    b.HasIndex("Description");

                    NpgsqlIndexBuilderExtensions.HasMethod(b.HasIndex("Description"), "gin");
                    NpgsqlIndexBuilderExtensions.HasOperators(b.HasIndex("Description"), new[] { "gin_trgm_ops" });

                    b.HasIndex("DuplicateJobId");

                    b.HasIndex("SourceId");

                    b.HasIndex("Title");

                    NpgsqlIndexBuilderExtensions.HasMethod(b.HasIndex("Title"), "gin");
                    NpgsqlIndexBuilderExtensions.HasOperators(b.HasIndex("Title"), new[] { "gin_trgm_ops" });

                    b.ToTable("Jobs");
                });

            modelBuilder.Entity("JobHunt.Models.JobCategory", b =>
                {
                    b.Property<int>("JobId")
                        .HasColumnType("integer");

                    b.Property<int>("CategoryId")
                        .HasColumnType("integer");

                    b.HasKey("JobId", "CategoryId");

                    b.HasIndex("CategoryId");

                    b.ToTable("JobCategories");
                });

            modelBuilder.Entity("JobHunt.Models.Search", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("Country")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int?>("Distance")
                        .HasColumnType("integer");

                    b.Property<bool>("EmployerOnly")
                        .HasColumnType("boolean");

                    b.Property<bool>("Enabled")
                        .HasColumnType("boolean");

                    b.Property<string>("JobType")
                        .HasColumnType("text");

                    b.Property<bool?>("LastFetchSuccess")
                        .HasColumnType("boolean");

                    b.Property<int?>("LastResultCount")
                        .HasColumnType("integer");

                    b.Property<DateTime?>("LastRun")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Location")
                        .HasColumnType("text");

                    b.Property<int?>("MaxAge")
                        .HasColumnType("integer");

                    b.Property<string>("Provider")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Query")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.ToTable("Searches");
                });

            modelBuilder.Entity("JobHunt.Models.SearchRun", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("Message")
                        .HasColumnType("text");

                    b.Property<int>("NewCompanies")
                        .HasColumnType("integer");

                    b.Property<int>("NewJobs")
                        .HasColumnType("integer");

                    b.Property<int>("SearchId")
                        .HasColumnType("integer");

                    b.Property<bool>("Success")
                        .HasColumnType("boolean");

                    b.Property<DateTime>("Time")
                        .HasColumnType("timestamp with time zone");

                    b.Property<int>("TimeTaken")
                        .HasColumnType("integer");

                    b.HasKey("Id");

                    b.HasIndex("SearchId");

                    b.ToTable("SearchRuns");
                });

            modelBuilder.Entity("JobHunt.Models.WatchedPage", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<int>("CompanyId")
                        .HasColumnType("integer");

                    b.Property<string>("CssBlacklist")
                        .HasColumnType("text");

                    b.Property<string>("CssSelector")
                        .HasColumnType("text");

                    b.Property<bool>("Enabled")
                        .HasColumnType("boolean");

                    b.Property<DateTime?>("LastScraped")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime?>("LastUpdated")
                        .HasColumnType("timestamp with time zone");

                    b.Property<bool>("RequiresJS")
                        .HasColumnType("boolean");

                    b.Property<string>("StatusMessage")
                        .HasColumnType("text");

                    b.Property<string>("Url")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("CompanyId");

                    b.ToTable("WatchedPages");
                });

            modelBuilder.Entity("JobHunt.Models.WatchedPageChange", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<DateTime>("Created")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Html")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("ScreenshotFileName")
                        .HasColumnType("text");

                    b.Property<int>("WatchedPageId")
                        .HasColumnType("integer");

                    b.HasKey("Id");

                    b.HasIndex("WatchedPageId");

                    b.ToTable("WatchedPageChanges");
                });

            modelBuilder.Entity("JobHunt.Models.CompanyCategory", b =>
                {
                    b.HasOne("JobHunt.Models.Category", "Category")
                        .WithMany("CompanyCategories")
                        .HasForeignKey("CategoryId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("JobHunt.Models.Company", "Company")
                        .WithMany("CompanyCategories")
                        .HasForeignKey("CompanyId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Category");

                    b.Navigation("Company");
                });

            modelBuilder.Entity("JobHunt.Models.CompanyName", b =>
                {
                    b.HasOne("JobHunt.Models.Company", "Company")
                        .WithMany("AlternateNames")
                        .HasForeignKey("CompanyId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Company");
                });

            modelBuilder.Entity("JobHunt.Models.Job", b =>
                {
                    b.HasOne("JobHunt.Models.Company", "ActualCompany")
                        .WithMany()
                        .HasForeignKey("ActualCompanyId")
                        .OnDelete(DeleteBehavior.SetNull);

                    b.HasOne("JobHunt.Models.Company", "Company")
                        .WithMany("Jobs")
                        .HasForeignKey("CompanyId")
                        .OnDelete(DeleteBehavior.Cascade);

                    b.HasOne("JobHunt.Models.Job", "DuplicateJob")
                        .WithMany()
                        .HasForeignKey("DuplicateJobId");

                    b.HasOne("JobHunt.Models.Search", "Source")
                        .WithMany("FoundJobs")
                        .HasForeignKey("SourceId")
                        .OnDelete(DeleteBehavior.SetNull);

                    b.Navigation("ActualCompany");

                    b.Navigation("Company");

                    b.Navigation("DuplicateJob");

                    b.Navigation("Source");
                });

            modelBuilder.Entity("JobHunt.Models.JobCategory", b =>
                {
                    b.HasOne("JobHunt.Models.Category", "Category")
                        .WithMany("JobCategories")
                        .HasForeignKey("CategoryId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("JobHunt.Models.Job", "Job")
                        .WithMany("JobCategories")
                        .HasForeignKey("JobId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Category");

                    b.Navigation("Job");
                });

            modelBuilder.Entity("JobHunt.Models.SearchRun", b =>
                {
                    b.HasOne("JobHunt.Models.Search", "Search")
                        .WithMany("Runs")
                        .HasForeignKey("SearchId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Search");
                });

            modelBuilder.Entity("JobHunt.Models.WatchedPage", b =>
                {
                    b.HasOne("JobHunt.Models.Company", "Company")
                        .WithMany("WatchedPages")
                        .HasForeignKey("CompanyId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Company");
                });

            modelBuilder.Entity("JobHunt.Models.WatchedPageChange", b =>
                {
                    b.HasOne("JobHunt.Models.WatchedPage", "WatchedPage")
                        .WithMany("Changes")
                        .HasForeignKey("WatchedPageId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("WatchedPage");
                });

            modelBuilder.Entity("JobHunt.Models.Category", b =>
                {
                    b.Navigation("CompanyCategories");

                    b.Navigation("JobCategories");
                });

            modelBuilder.Entity("JobHunt.Models.Company", b =>
                {
                    b.Navigation("AlternateNames");

                    b.Navigation("CompanyCategories");

                    b.Navigation("Jobs");

                    b.Navigation("WatchedPages");
                });

            modelBuilder.Entity("JobHunt.Models.Job", b =>
                {
                    b.Navigation("JobCategories");
                });

            modelBuilder.Entity("JobHunt.Models.Search", b =>
                {
                    b.Navigation("FoundJobs");

                    b.Navigation("Runs");
                });

            modelBuilder.Entity("JobHunt.Models.WatchedPage", b =>
                {
                    b.Navigation("Changes");
                });
#pragma warning restore 612, 618
        }
    }
}
