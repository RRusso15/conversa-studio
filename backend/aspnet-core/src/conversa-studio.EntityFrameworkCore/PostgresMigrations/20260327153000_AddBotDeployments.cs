using System;
using ConversaStudio.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConversaStudio.PostgresMigrations
{
    /// <summary>
    /// Adds persisted widget deployment records for published bots.
    /// </summary>
    [DbContext(typeof(ConversaStudioDbContext))]
    [Migration("20260327153000_AddBotDeployments")]
    public partial class AddBotDeployments : Migration
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

            migrationBuilder.CreateIndex(
                name: "IX_AppBotDeployments_DeploymentKey",
                table: "AppBotDeployments",
                column: "DeploymentKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppBotDeployments_TenantId_BotDefinitionId_CreationTime",
                table: "AppBotDeployments",
                columns: new[] { "TenantId", "BotDefinitionId", "CreationTime" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppBotDeployments");
        }
    }
}
