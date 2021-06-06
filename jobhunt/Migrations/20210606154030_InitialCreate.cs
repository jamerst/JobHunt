using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace JobHunt.Migrations
{
    public partial class InitialCreate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Alerts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Read = table.Column<bool>(type: "boolean", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: true),
                    Url = table.Column<string>(type: "text", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alerts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Companies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    Watched = table.Column<bool>(type: "boolean", nullable: false),
                    Blacklisted = table.Column<bool>(type: "boolean", nullable: false),
                    Website = table.Column<string>(type: "text", nullable: true),
                    Rating = table.Column<short>(type: "smallint", nullable: true),
                    Glassdoor = table.Column<string>(type: "text", nullable: true),
                    GlassdoorId = table.Column<string>(type: "text", nullable: true),
                    GlassdoorRating = table.Column<float>(type: "real", nullable: true),
                    LinkedIn = table.Column<string>(type: "text", nullable: true),
                    Endole = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Companies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Searches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Provider = table.Column<string>(type: "text", nullable: false),
                    Query = table.Column<string>(type: "text", nullable: false),
                    Country = table.Column<string>(type: "text", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: true),
                    Distance = table.Column<int>(type: "integer", nullable: true),
                    MaxAge = table.Column<int>(type: "integer", nullable: true),
                    LastResultCount = table.Column<int>(type: "integer", nullable: true),
                    LastFetchSuccess = table.Column<bool>(type: "boolean", nullable: true),
                    Enabled = table.Column<bool>(type: "boolean", nullable: false),
                    EmployerOnly = table.Column<bool>(type: "boolean", nullable: false),
                    JobType = table.Column<string>(type: "text", nullable: true),
                    LastRun = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Searches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CompanyCategories",
                columns: table => new
                {
                    CompanyId = table.Column<int>(type: "integer", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyCategories", x => new { x.CompanyId, x.CategoryId });
                    table.ForeignKey(
                        name: "FK_CompanyCategories_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompanyCategories_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CompanyNames",
                columns: table => new
                {
                    CompanyId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyNames", x => new { x.CompanyId, x.Name });
                    table.ForeignKey(
                        name: "FK_CompanyNames_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WatchedPages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompanyId = table.Column<int>(type: "integer", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: false),
                    Hash = table.Column<string>(type: "text", nullable: true),
                    CssSelector = table.Column<string>(type: "text", nullable: true),
                    CssBlacklist = table.Column<string>(type: "text", nullable: true),
                    LastScraped = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    LastUpdated = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    StatusMessage = table.Column<string>(type: "text", nullable: true),
                    Enabled = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WatchedPages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WatchedPages_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Jobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Salary = table.Column<string>(type: "text", nullable: true),
                    AvgYearlySalary = table.Column<int>(type: "integer", nullable: true),
                    Location = table.Column<string>(type: "text", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    Url = table.Column<string>(type: "text", nullable: true),
                    CompanyId = table.Column<int>(type: "integer", nullable: true),
                    Posted = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    Seen = table.Column<bool>(type: "boolean", nullable: false),
                    Archived = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    DateApplied = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Provider = table.Column<string>(type: "text", nullable: true),
                    ProviderId = table.Column<string>(type: "text", nullable: true),
                    SourceId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Jobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Jobs_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Jobs_Searches_SourceId",
                        column: x => x.SourceId,
                        principalTable: "Searches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "SearchRuns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SearchId = table.Column<int>(type: "integer", nullable: false),
                    Time = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Success = table.Column<bool>(type: "boolean", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: true),
                    NewJobs = table.Column<int>(type: "integer", nullable: false),
                    NewCompanies = table.Column<int>(type: "integer", nullable: false),
                    TimeTaken = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SearchRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SearchRuns_Searches_SearchId",
                        column: x => x.SearchId,
                        principalTable: "Searches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "JobCategories",
                columns: table => new
                {
                    JobId = table.Column<int>(type: "integer", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobCategories", x => new { x.JobId, x.CategoryId });
                    table.ForeignKey(
                        name: "FK_JobCategories_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_JobCategories_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompanyCategories_CategoryId",
                table: "CompanyCategories",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_JobCategories_CategoryId",
                table: "JobCategories",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_CompanyId",
                table: "Jobs",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_SourceId",
                table: "Jobs",
                column: "SourceId");

            migrationBuilder.CreateIndex(
                name: "IX_SearchRuns_SearchId",
                table: "SearchRuns",
                column: "SearchId");

            migrationBuilder.CreateIndex(
                name: "IX_WatchedPages_CompanyId",
                table: "WatchedPages",
                column: "CompanyId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Alerts");

            migrationBuilder.DropTable(
                name: "CompanyCategories");

            migrationBuilder.DropTable(
                name: "CompanyNames");

            migrationBuilder.DropTable(
                name: "JobCategories");

            migrationBuilder.DropTable(
                name: "SearchRuns");

            migrationBuilder.DropTable(
                name: "WatchedPages");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropTable(
                name: "Jobs");

            migrationBuilder.DropTable(
                name: "Companies");

            migrationBuilder.DropTable(
                name: "Searches");
        }
    }
}
