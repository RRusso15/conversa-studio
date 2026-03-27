namespace ConversaStudio.Services.Runtime.Dto;

/// <summary>
/// Defines the request contract for sending a user message into the live widget runtime.
/// </summary>
public class SendWidgetMessageRequest
{
    /// <summary>
    /// Gets or sets the user message text.
    /// </summary>
    public string Message { get; set; } = string.Empty;
}
