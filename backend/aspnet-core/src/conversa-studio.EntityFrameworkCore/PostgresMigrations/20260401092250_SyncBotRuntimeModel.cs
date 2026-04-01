using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConversaStudio.PostgresMigrations
{
    /// <inheritdoc />
    public partial class SyncBotRuntimeModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AiApiKeyEncrypted",
                table: "AppBotDefinitions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AiEmbeddingModel",
                table: "AppBotDefinitions",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AiGenerationModel",
                table: "AppBotDefinitions",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AiKnowledgeJson",
                table: "AppBotDefinitions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AiProvider",
                table: "AppBotDefinitions",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AiApiKeyEncrypted",
                table: "AppBotDefinitions");

            migrationBuilder.DropColumn(
                name: "AiEmbeddingModel",
                table: "AppBotDefinitions");

            migrationBuilder.DropColumn(
                name: "AiGenerationModel",
                table: "AppBotDefinitions");

            migrationBuilder.DropColumn(
                name: "AiKnowledgeJson",
                table: "AppBotDefinitions");

            migrationBuilder.DropColumn(
                name: "AiProvider",
                table: "AppBotDefinitions");
        }
    }
}
