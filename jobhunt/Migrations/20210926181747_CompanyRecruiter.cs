using Microsoft.EntityFrameworkCore.Migrations;

namespace JobHunt.Migrations
{
    public partial class CompanyRecruiter : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Recruiter",
                table: "Companies",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Recruiter",
                table: "Companies");
        }
    }
}
