using System;

namespace ConversaStudio.Services.Bots.Dto;

/// <summary>
/// Defines the request contract for updating a persisted draft bot definition.
/// </summary>
public class UpdateBotDefinitionRequest
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
    /// Gets or sets the updated draft graph.
    /// </summary>
    public BotGraphDto Graph { get; set; } = new();
}
