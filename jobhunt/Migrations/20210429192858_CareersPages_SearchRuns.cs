using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace JobHunt.Migrations
{
    public partial class CareersPages_SearchRuns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CareersCssBlacklist",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CareersCssSelector",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CareersHash",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CareersLastScraped",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CareersLastUpdated",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CareersPage",
                table: "Companies");

            migrationBuilder.CreateTable(
                name: "CompanyCareersPages",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CompanyId = table.Column<string>(type: "text", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: false),
                    Hash = table.Column<string>(type: "text", nullable: true),
                    CssSelector = table.Column<string>(type: "text", nullable: true),
                    CssBlacklist = table.Column<string>(type: "text", nullable: true),
                    LastScraped = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    LastUpdated = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    StatusMessage = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyCareersPages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompanyCareersPages_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SearchRuns",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    SearchId = table.Column<string>(type: "text", nullable: false),
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

            migrationBuilder.CreateIndex(
                name: "IX_CompanyCareersPages_CompanyId",
                table: "CompanyCareersPages",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_SearchRuns_SearchId",
                table: "SearchRuns",
                column: "SearchId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompanyCareersPages");

            migrationBuilder.DropTable(
                name: "SearchRuns");

            migrationBuilder.AddColumn<string>(
                name: "CareersCssBlacklist",
                table: "Companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CareersCssSelector",
                table: "Companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CareersHash",
                table: "Companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CareersLastScraped",
                table: "Companies",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CareersLastUpdated",
                table: "Companies",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CareersPage",
                table: "Companies",
                type: "text",
                nullable: true);
        }
    }
}
