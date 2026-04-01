using System;
using ConversaStudio.Services.AiKnowledge.Dto;

namespace ConversaStudio.Services.Bots.Dto;

/// <summary>
/// Represents a persisted bot definition and its current editable graph.
/// </summary>
public class BotDefinitionDto
{
    /// <summary>
    /// Gets or sets the bot identifier.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the bot name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the lifecycle status.
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the editable draft version.
    /// </summary>
    public int DraftVersion { get; set; }

    /// <summary>
    /// Gets or sets the published version when available.
    /// </summary>
    public int? PublishedVersion { get; set; }

    /// <summary>
    /// Gets or sets whether the current draft differs from the published snapshot.
    /// </summary>
    public bool HasUnpublishedChanges { get; set; }

    /// <summary>
    /// Gets or sets the last updated timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Gets or sets the current editable graph.
    /// </summary>
    public BotGraphDto Graph { get; set; } = new();

    /// <summary>
    /// Gets or sets the bot-scoped AI knowledge status.
    /// </summary>
    public BotAiKnowledgeDto AiKnowledge { get; set; } = new();
}
