using System;

namespace ConversaStudio.Services.Runtime.Dto;

/// <summary>
/// Represents a user-visible runtime message.
/// </summary>
public class WidgetChatMessageDto
{
    /// <summary>
    /// Gets or sets the message role.
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the message content.
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the message timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
