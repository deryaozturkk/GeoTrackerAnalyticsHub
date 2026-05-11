using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GeoTracker.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAiFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AiAnalysis",
                table: "PointsOfInterest",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AiRiskScore",
                table: "PointsOfInterest",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AiAnalysis",
                table: "PointsOfInterest");

            migrationBuilder.DropColumn(
                name: "AiRiskScore",
                table: "PointsOfInterest");
        }
    }
}
