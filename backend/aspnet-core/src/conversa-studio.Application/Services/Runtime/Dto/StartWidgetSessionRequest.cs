namespace ConversaStudio.Services.Runtime.Dto;

/// <summary>
/// Defines the request contract for creating or resuming a widget session.
/// </summary>
public class StartWidgetSessionRequest
{
    /// <summary>
    /// Gets or sets an optional existing session identifier to resume.
    /// </summary>
    public string SessionId { get; set; } = string.Empty;
}
