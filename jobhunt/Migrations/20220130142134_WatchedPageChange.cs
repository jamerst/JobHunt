using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace JobHunt.Migrations
{
    public partial class WatchedPageChange : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Hash",
                table: "WatchedPages");

            migrationBuilder.CreateTable(
                name: "WatchedPageChanges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WatchedPageId = table.Column<int>(type: "integer", nullable: false),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Html = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WatchedPageChanges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WatchedPageChanges_WatchedPages_WatchedPageId",
                        column: x => x.WatchedPageId,
                        principalTable: "WatchedPages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WatchedPageChanges_WatchedPageId",
                table: "WatchedPageChanges",
                column: "WatchedPageId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WatchedPageChanges");

            migrationBuilder.AddColumn<string>(
                name: "Hash",
                table: "WatchedPages",
                type: "text",
                nullable: true);
        }
    }
}
