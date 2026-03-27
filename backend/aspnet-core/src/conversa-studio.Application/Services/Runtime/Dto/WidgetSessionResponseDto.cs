using System.Collections.Generic;

namespace ConversaStudio.Services.Runtime.Dto;

/// <summary>
/// Represents the result of starting or continuing a runtime session.
/// </summary>
public class WidgetSessionResponseDto
{
    /// <summary>
    /// Gets or sets the session identifier.
    /// </summary>
    public string SessionId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the bot name.
    /// </summary>
    public string BotName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the newly appended messages.
    /// </summary>
    public List<WidgetChatMessageDto> Messages { get; set; } = [];

    /// <summary>
    /// Gets or sets whether the runtime is waiting for user input.
    /// </summary>
    public bool AwaitingInput { get; set; }

    /// <summary>
    /// Gets or sets whether the conversation has completed.
    /// </summary>
    public bool IsCompleted { get; set; }
}
