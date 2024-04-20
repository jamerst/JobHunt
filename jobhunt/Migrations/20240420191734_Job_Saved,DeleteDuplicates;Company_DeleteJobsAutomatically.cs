using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobHunt.Migrations
{
    /// <inheritdoc />
    public partial class JobSavedDeleteDuplicatesCompanyDeleteJobsAutomatically : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "DeleteDuplicates",
                table: "Jobs",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Saved",
                table: "Jobs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "DeleteJobsAutomatically",
                table: "Companies",
                type: "boolean",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeleteDuplicates",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "Saved",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "DeleteJobsAutomatically",
                table: "Companies");
        }
    }
}
