using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobHunt.Migrations
{
    public partial class DuplicateJobs : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:pg_trgm", ",,");

            migrationBuilder.AddColumn<int>(
                name: "DuplicateJobId",
                table: "Jobs",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_Description",
                table: "Jobs",
                column: "Description")
                .Annotation("Npgsql:IndexMethod", "gin")
                .Annotation("Npgsql:IndexOperators", new[] { "gin_trgm_ops" });

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_DuplicateJobId",
                table: "Jobs",
                column: "DuplicateJobId");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_Title",
                table: "Jobs",
                column: "Title")
                .Annotation("Npgsql:IndexMethod", "gin")
                .Annotation("Npgsql:IndexOperators", new[] { "gin_trgm_ops" });

            migrationBuilder.AddForeignKey(
                name: "FK_Jobs_Jobs_DuplicateJobId",
                table: "Jobs",
                column: "DuplicateJobId",
                principalTable: "Jobs",
                principalColumn: "Id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Jobs_Jobs_DuplicateJobId",
                table: "Jobs");

            migrationBuilder.DropIndex(
                name: "IX_Jobs_Description",
                table: "Jobs");

            migrationBuilder.DropIndex(
                name: "IX_Jobs_DuplicateJobId",
                table: "Jobs");

            migrationBuilder.DropIndex(
                name: "IX_Jobs_Title",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "DuplicateJobId",
                table: "Jobs");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:PostgresExtension:pg_trgm", ",,");
        }
    }
}
