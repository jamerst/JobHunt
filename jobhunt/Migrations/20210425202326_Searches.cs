using Microsoft.EntityFrameworkCore.Migrations;

namespace JobHunt.Migrations
{
    public partial class Searches : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SearchSourceId",
                table: "Jobs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "Jobs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceId",
                table: "Jobs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Blacklisted",
                table: "Companies",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "CareersCssBlacklist",
                table: "Companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GlassdoorId",
                table: "Companies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "GlassdoorRating",
                table: "Companies",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Watched",
                table: "Companies",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "CompanyNames",
                columns: table => new
                {
                    CompanyId = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Id = table.Column<string>(type: "text", nullable: true)
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
                name: "Searches",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Provider = table.Column<string>(type: "text", nullable: false),
                    Query = table.Column<string>(type: "text", nullable: false),
                    Country = table.Column<string>(type: "text", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: true),
                    Distance = table.Column<int>(type: "integer", nullable: true),
                    MaxAge = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Searches", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_SearchSourceId",
                table: "Jobs",
                column: "SearchSourceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Jobs_Searches_SearchSourceId",
                table: "Jobs",
                column: "SearchSourceId",
                principalTable: "Searches",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Jobs_Searches_SearchSourceId",
                table: "Jobs");

            migrationBuilder.DropTable(
                name: "CompanyNames");

            migrationBuilder.DropTable(
                name: "Searches");

            migrationBuilder.DropIndex(
                name: "IX_Jobs_SearchSourceId",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "SearchSourceId",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "SourceId",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "Blacklisted",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CareersCssBlacklist",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "GlassdoorId",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "GlassdoorRating",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "Watched",
                table: "Companies");
        }
    }
}
