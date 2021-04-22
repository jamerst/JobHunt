﻿// <auto-generated />
using System;
using JobHunt.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace JobHunt.Migrations
{
    [DbContext(typeof(JobHuntContext))]
    partial class JobHuntContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("Relational:MaxIdentifierLength", 63)
                .HasAnnotation("ProductVersion", "5.0.5")
                .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            modelBuilder.Entity("JobHunt.Models.Category", b =>
                {
                    b.Property<string>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("text");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.ToTable("Categories");
                });

            modelBuilder.Entity("JobHunt.Models.Company", b =>
                {
                    b.Property<string>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("text");

                    b.Property<string>("CareersCssSelector")
                        .HasColumnType("text");

                    b.Property<string>("CareersHash")
                        .HasColumnType("text");

                    b.Property<DateTime?>("CareersLastScraped")
                        .HasColumnType("timestamp without time zone");

                    b.Property<DateTime?>("CareersLastUpdated")
                        .HasColumnType("timestamp without time zone");

                    b.Property<string>("CareersPage")
                        .HasColumnType("text");

                    b.Property<string>("Endole")
                        .HasColumnType("text");

                    b.Property<string>("Glassdoor")
                        .HasColumnType("text");

                    b.Property<string>("LinkedIn")
                        .HasColumnType("text");

                    b.Property<string>("Location")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Notes")
                        .HasColumnType("text");

                    b.Property<short?>("Rating")
                        .HasColumnType("smallint");

                    b.Property<string>("Website")
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.ToTable("Companies");
                });

            modelBuilder.Entity("JobHunt.Models.CompanyCategory", b =>
                {
                    b.Property<string>("CompanyId")
                        .HasColumnType("text");

                    b.Property<string>("CategoryId")
                        .HasColumnType("text");

                    b.HasKey("CompanyId", "CategoryId");

                    b.HasIndex("CategoryId");

                    b.ToTable("CompanyCategories");
                });

            modelBuilder.Entity("JobHunt.Models.Job", b =>
                {
                    b.Property<string>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("text");

                    b.Property<bool>("Archived")
                        .HasColumnType("boolean");

                    b.Property<string>("CompanyId")
                        .HasColumnType("text");

                    b.Property<DateTime?>("DateApplied")
                        .HasColumnType("timestamp without time zone");

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Location")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Notes")
                        .HasColumnType("text");

                    b.Property<DateTime?>("Posted")
                        .HasColumnType("timestamp without time zone");

                    b.Property<string>("Salary")
                        .HasColumnType("text");

                    b.Property<string>("Status")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Title")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Url")
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("CompanyId");

                    b.ToTable("Jobs");
                });

            modelBuilder.Entity("JobHunt.Models.JobCategory", b =>
                {
                    b.Property<string>("JobId")
                        .HasColumnType("text");

                    b.Property<string>("CategoryId")
                        .HasColumnType("text");

                    b.HasKey("JobId", "CategoryId");

                    b.HasIndex("CategoryId");

                    b.ToTable("JobCategories");
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

            modelBuilder.Entity("JobHunt.Models.Job", b =>
                {
                    b.HasOne("JobHunt.Models.Company", "Company")
                        .WithMany("Jobs")
                        .HasForeignKey("CompanyId")
                        .OnDelete(DeleteBehavior.Cascade);

                    b.Navigation("Company");
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

            modelBuilder.Entity("JobHunt.Models.Category", b =>
                {
                    b.Navigation("CompanyCategories");

                    b.Navigation("JobCategories");
                });

            modelBuilder.Entity("JobHunt.Models.Company", b =>
                {
                    b.Navigation("CompanyCategories");

                    b.Navigation("Jobs");
                });

            modelBuilder.Entity("JobHunt.Models.Job", b =>
                {
                    b.Navigation("JobCategories");
                });
#pragma warning restore 612, 618
        }
    }
}
