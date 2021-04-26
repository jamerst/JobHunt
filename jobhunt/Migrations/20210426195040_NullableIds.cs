using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace JobHunt.Migrations
{
    public partial class NullableIds : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Jobs_Searches_SearchSourceId",
                table: "Jobs");

            migrationBuilder.DropIndex(
                name: "IX_Jobs_SearchSourceId",
                table: "Jobs");

            migrationBuilder.RenameColumn(
                name: "Source",
                table: "Jobs",
                newName: "ProviderId");

            migrationBuilder.RenameColumn(
                name: "SearchSourceId",
                table: "Jobs",
                newName: "Provider");

            migrationBuilder.AddColumn<bool>(
                name: "LastFetchSuccess",
                table: "Searches",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LastResultCount",
                table: "Searches",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastRun",
                table: "Searches",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_SourceId",
                table: "Jobs",
                column: "SourceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Jobs_Searches_SourceId",
                table: "Jobs",
                column: "SourceId",
                principalTable: "Searches",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Jobs_Searches_SourceId",
                table: "Jobs");

            migrationBuilder.DropIndex(
                name: "IX_Jobs_SourceId",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "LastFetchSuccess",
                table: "Searches");

            migrationBuilder.DropColumn(
                name: "LastResultCount",
                table: "Searches");

            migrationBuilder.DropColumn(
                name: "LastRun",
                table: "Searches");

            migrationBuilder.RenameColumn(
                name: "ProviderId",
                table: "Jobs",
                newName: "Source");

            migrationBuilder.RenameColumn(
                name: "Provider",
                table: "Jobs",
                newName: "SearchSourceId");

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
    }
}
