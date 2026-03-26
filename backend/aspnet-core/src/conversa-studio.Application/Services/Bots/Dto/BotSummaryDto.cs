using System;

namespace ConversaStudio.Services.Bots.Dto;

/// <summary>
/// Represents a summary row returned for the projects list.
/// </summary>
public class BotSummaryDto
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
    /// Gets or sets the last updated timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
