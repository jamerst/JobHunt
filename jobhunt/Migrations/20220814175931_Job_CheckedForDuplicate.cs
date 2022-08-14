using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobHunt.Migrations
{
    public partial class Job_CheckedForDuplicate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CheckedForDuplicate",
                table: "Jobs",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CheckedForDuplicate",
                table: "Jobs");
        }
    }
}
