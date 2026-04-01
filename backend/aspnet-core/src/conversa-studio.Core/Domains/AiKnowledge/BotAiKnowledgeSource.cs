using System;
using System.Collections.Generic;

namespace ConversaStudio.Domains.AiKnowledge;

/// <summary>
/// Represents a single bot-scoped AI knowledge source and its derived chunks.
/// </summary>
public class BotAiKnowledgeSource
{
    /// <summary>
    /// Gets or sets the source identifier.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the source type.
    /// </summary>
    public string SourceType { get; set; } = BotAiKnowledgeSourceType.Text;

    /// <summary>
    /// Gets or sets the display title shown in the builder.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the raw extracted text retained for future re-ingestion.
    /// </summary>
    public string RawText { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the original URL for URL-based sources.
    /// </summary>
    public string SourceUrl { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the original file name for uploaded documents.
    /// </summary>
    public string SourceFileName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the ingestion status.
    /// </summary>
    public string Status { get; set; } = BotAiKnowledgeSourceStatus.Processing;

    /// <summary>
    /// Gets or sets the latest ingestion failure reason, when present.
    /// </summary>
    public string FailureReason { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets when the source was last ingested successfully or unsuccessfully.
    /// </summary>
    public DateTime? LastIngestedAtUtc { get; set; }

    /// <summary>
    /// Gets or sets the embedded knowledge chunks derived from the raw text.
    /// </summary>
    public List<BotAiKnowledgeChunk> Chunks { get; set; } = [];
}
