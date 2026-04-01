using System;
using System.Collections.Generic;
using Abp.Application.Services.Dto;

namespace ConversaStudio.Services.AiKnowledge.Dto;

/// <summary>
/// Represents the bot-scoped AI knowledge summary returned to the builder.
/// </summary>
public class BotAiKnowledgeDto
{
    /// <summary>
    /// Gets or sets the owning bot identifier.
    /// </summary>
    public Guid BotId { get; set; }

    /// <summary>
    /// Gets or sets the configured provider.
    /// </summary>
    public string Provider { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the configured generation model.
    /// </summary>
    public string GenerationModel { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the configured embedding model.
    /// </summary>
    public string EmbeddingModel { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets whether an API key has been configured.
    /// </summary>
    public bool HasApiKey { get; set; }

    /// <summary>
    /// Gets or sets the total source count.
    /// </summary>
    public int SourceCount { get; set; }

    /// <summary>
    /// Gets or sets the number of ready sources.
    /// </summary>
    public int ReadySourceCount { get; set; }

    /// <summary>
    /// Gets or sets whether the AI knowledge configuration is ready for runtime use.
    /// </summary>
    public bool IsKnowledgeConfigured { get; set; }

    /// <summary>
    /// Gets or sets the configured sources.
    /// </summary>
    public List<BotAiKnowledgeSourceDto> Sources { get; set; } = [];
}

/// <summary>
/// Represents a single bot-scoped knowledge source.
/// </summary>
public class BotAiKnowledgeSourceDto : EntityDto<Guid>
{
    /// <summary>
    /// Gets or sets the source type.
    /// </summary>
    public string SourceType { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the display title.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the source status.
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the failure reason when ingestion failed.
    /// </summary>
    public string FailureReason { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the original URL when applicable.
    /// </summary>
    public string SourceUrl { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the original file name when applicable.
    /// </summary>
    public string SourceFileName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets when the source was last ingested.
    /// </summary>
    public DateTime? LastIngestedAtUtc { get; set; }

    /// <summary>
    /// Gets or sets the number of derived chunks.
    /// </summary>
    public int ChunkCount { get; set; }
}

/// <summary>
/// Updates the bot-scoped AI provider settings.
/// </summary>
public class UpsertBotAiSettingsRequest
{
    /// <summary>
    /// Gets or sets the owning bot identifier.
    /// </summary>
    public Guid BotId { get; set; }

    /// <summary>
    /// Gets or sets the API key to store for the bot.
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the generation model.
    /// </summary>
    public string GenerationModel { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the embedding model.
    /// </summary>
    public string EmbeddingModel { get; set; } = string.Empty;
}

/// <summary>
/// Adds a pasted text knowledge source.
/// </summary>
public class AddBotAiTextSourceRequest
{
    /// <summary>
    /// Gets or sets the owning bot identifier.
    /// </summary>
    public Guid BotId { get; set; }

    /// <summary>
    /// Gets or sets the display title.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the source text content.
    /// </summary>
    public string Text { get; set; } = string.Empty;
}

/// <summary>
/// Adds a URL knowledge source.
/// </summary>
public class AddBotAiUrlSourceRequest
{
    /// <summary>
    /// Gets or sets the owning bot identifier.
    /// </summary>
    public Guid BotId { get; set; }

    /// <summary>
    /// Gets or sets the display title.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the URL to fetch.
    /// </summary>
    public string Url { get; set; } = string.Empty;
}

/// <summary>
/// Adds a PDF knowledge source by passing the file content as base64.
/// </summary>
public class AddBotAiPdfSourceRequest
{
    /// <summary>
    /// Gets or sets the owning bot identifier.
    /// </summary>
    public Guid BotId { get; set; }

    /// <summary>
    /// Gets or sets the display title.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the original file name.
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the base64 encoded PDF content.
    /// </summary>
    public string Base64Content { get; set; } = string.Empty;
}

/// <summary>
/// Identifies a bot-scoped knowledge source to update or delete.
/// </summary>
public class ManageBotAiSourceRequest
{
    /// <summary>
    /// Gets or sets the owning bot identifier.
    /// </summary>
    public Guid BotId { get; set; }

    /// <summary>
    /// Gets or sets the source identifier.
    /// </summary>
    public Guid SourceId { get; set; }
}
