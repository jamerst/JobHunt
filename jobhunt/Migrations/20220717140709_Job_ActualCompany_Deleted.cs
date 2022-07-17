using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobHunt.Migrations
{
    public partial class Job_ActualCompany_Deleted : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActualCompanyId",
                table: "Jobs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Deleted",
                table: "Jobs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_ActualCompanyId",
                table: "Jobs",
                column: "ActualCompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Jobs_Companies_ActualCompanyId",
                table: "Jobs",
                column: "ActualCompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Jobs_Companies_ActualCompanyId",
                table: "Jobs");

            migrationBuilder.DropIndex(
                name: "IX_Jobs_ActualCompanyId",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "ActualCompanyId",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "Deleted",
                table: "Jobs");
        }
    }
}
