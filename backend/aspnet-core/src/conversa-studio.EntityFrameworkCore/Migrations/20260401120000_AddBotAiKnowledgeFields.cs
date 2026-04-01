using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConversaStudio.Migrations
{
    /// <summary>
    /// Adds bot-scoped AI configuration columns to the bot definitions table when that table already exists.
    /// </summary>
    public partial class AddBotAiKnowledgeFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[AppBotDefinitions]', N'U') IS NOT NULL
                BEGIN
                    IF COL_LENGTH(N'AppBotDefinitions', N'AiProvider') IS NULL
                    BEGIN
                        ALTER TABLE [AppBotDefinitions] ADD [AiProvider] nvarchar(32) NULL;
                        UPDATE [AppBotDefinitions] SET [AiProvider] = N'' WHERE [AiProvider] IS NULL;
                        ALTER TABLE [AppBotDefinitions] ALTER COLUMN [AiProvider] nvarchar(32) NOT NULL;
                    END

                    IF COL_LENGTH(N'AppBotDefinitions', N'AiApiKeyEncrypted') IS NULL
                    BEGIN
                        ALTER TABLE [AppBotDefinitions] ADD [AiApiKeyEncrypted] nvarchar(max) NULL;
                        UPDATE [AppBotDefinitions] SET [AiApiKeyEncrypted] = N'' WHERE [AiApiKeyEncrypted] IS NULL;
                        ALTER TABLE [AppBotDefinitions] ALTER COLUMN [AiApiKeyEncrypted] nvarchar(max) NOT NULL;
                    END

                    IF COL_LENGTH(N'AppBotDefinitions', N'AiGenerationModel') IS NULL
                    BEGIN
                        ALTER TABLE [AppBotDefinitions] ADD [AiGenerationModel] nvarchar(64) NULL;
                        UPDATE [AppBotDefinitions] SET [AiGenerationModel] = N'' WHERE [AiGenerationModel] IS NULL;
                        ALTER TABLE [AppBotDefinitions] ALTER COLUMN [AiGenerationModel] nvarchar(64) NOT NULL;
                    END

                    IF COL_LENGTH(N'AppBotDefinitions', N'AiEmbeddingModel') IS NULL
                    BEGIN
                        ALTER TABLE [AppBotDefinitions] ADD [AiEmbeddingModel] nvarchar(64) NULL;
                        UPDATE [AppBotDefinitions] SET [AiEmbeddingModel] = N'' WHERE [AiEmbeddingModel] IS NULL;
                        ALTER TABLE [AppBotDefinitions] ALTER COLUMN [AiEmbeddingModel] nvarchar(64) NOT NULL;
                    END

                    IF COL_LENGTH(N'AppBotDefinitions', N'AiKnowledgeJson') IS NULL
                    BEGIN
                        ALTER TABLE [AppBotDefinitions] ADD [AiKnowledgeJson] nvarchar(max) NULL;
                        UPDATE [AppBotDefinitions] SET [AiKnowledgeJson] = N'{"sources":[]}' WHERE [AiKnowledgeJson] IS NULL;
                        ALTER TABLE [AppBotDefinitions] ALTER COLUMN [AiKnowledgeJson] nvarchar(max) NOT NULL;
                    END
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[AppBotDefinitions]', N'U') IS NOT NULL
                BEGIN
                    IF COL_LENGTH(N'AppBotDefinitions', N'AiKnowledgeJson') IS NOT NULL
                    BEGIN
                        ALTER TABLE [AppBotDefinitions] DROP COLUMN [AiKnowledgeJson];
                    END

                    IF COL_LENGTH(N'AppBotDefinitions', N'AiEmbeddingModel') IS NOT NULL
                    BEGIN
                        ALTER TABLE [AppBotDefinitions] DROP COLUMN [AiEmbeddingModel];
                    END

                    IF COL_LENGTH(N'AppBotDefinitions', N'AiGenerationModel') IS NOT NULL
                    BEGIN
                        ALTER TABLE [AppBotDefinitions] DROP COLUMN [AiGenerationModel];
                    END

                    IF COL_LENGTH(N'AppBotDefinitions', N'AiApiKeyEncrypted') IS NOT NULL
                    BEGIN
                        ALTER TABLE [AppBotDefinitions] DROP COLUMN [AiApiKeyEncrypted];
                    END

                    IF COL_LENGTH(N'AppBotDefinitions', N'AiProvider') IS NOT NULL
                    BEGIN
                        ALTER TABLE [AppBotDefinitions] DROP COLUMN [AiProvider];
                    END
                END
                """);
        }
    }
}
