using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConversaStudio.PostgresMigrations
{
    /// <inheritdoc />
    public partial class AddWidgetRuntimeAndTranscripts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppBotDeployments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    BotDefinitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ChannelType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    DeploymentKey = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AllowedDomainsJson = table.Column<string>(type: "text", nullable: false),
                    LauncherLabel = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ThemeColor = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppBotDeployments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppRuntimeSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    BotDeploymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    BotDefinitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    PublishedVersion = table.Column<int>(type: "integer", nullable: false),
                    SessionToken = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CurrentNodeId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    VariablesJson = table.Column<string>(type: "character varying(16000)", maxLength: 16000, nullable: false),
                    AwaitingInput = table.Column<bool>(type: "boolean", nullable: false),
                    PendingQuestionVariable = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true),
                    LastModificationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifierUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeleterUserId = table.Column<long>(type: "bigint", nullable: true),
                    DeletionTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppRuntimeSessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppTranscriptMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    BotDeploymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    BotDefinitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    RuntimeSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Content = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    CreationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatorUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppTranscriptMessages", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppBotDeployments_DeploymentKey",
                table: "AppBotDeployments",
                column: "DeploymentKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppBotDeployments_TenantId_BotDefinitionId_CreationTime",
                table: "AppBotDeployments",
                columns: new[] { "TenantId", "BotDefinitionId", "CreationTime" });

            migrationBuilder.CreateIndex(
                name: "IX_AppRuntimeSessions_SessionToken",
                table: "AppRuntimeSessions",
                column: "SessionToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppRuntimeSessions_TenantId_BotDeploymentId_CreationTime",
                table: "AppRuntimeSessions",
                columns: new[] { "TenantId", "BotDeploymentId", "CreationTime" });

            migrationBuilder.CreateIndex(
                name: "IX_AppTranscriptMessages_TenantId_RuntimeSessionId_CreationTime",
                table: "AppTranscriptMessages",
                columns: new[] { "TenantId", "RuntimeSessionId", "CreationTime" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppBotDeployments");

            migrationBuilder.DropTable(
                name: "AppRuntimeSessions");

            migrationBuilder.DropTable(
                name: "AppTranscriptMessages");
        }
    }
}
