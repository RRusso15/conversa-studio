using System.Collections.Generic;

namespace ConversaStudio.Services.Runtime.Dto;

/// <summary>
/// Represents a one-time handoff event raised by the widget runtime.
/// </summary>
public class WidgetHandoffDto
{
    /// <summary>
    /// Gets or sets the handoff node identifier.
    /// </summary>
    public string NodeId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the selected inbox key.
    /// </summary>
    public string InboxKey { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the inbox display label.
    /// </summary>
    public string InboxLabel { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the resolved recipient email address.
    /// </summary>
    public string RecipientEmail { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the captured contact email for the current session.
    /// </summary>
    public string ContactEmail { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the current runtime variables when the handoff fired.
    /// </summary>
    public Dictionary<string, string> Variables { get; set; } = [];
}
