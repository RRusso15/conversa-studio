using System;

namespace ConversaStudio.Services.Runtime.Dto;

/// <summary>
/// Represents public widget bootstrap configuration for an active deployment.
/// </summary>
public class WidgetBootstrapDto
{
    /// <summary>
    /// Gets or sets the deployment identifier.
    /// </summary>
    public Guid DeploymentId { get; set; }

    /// <summary>
    /// Gets or sets the public deployment key.
    /// </summary>
    public string DeploymentKey { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the bot display name.
    /// </summary>
    public string BotName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the launcher label.
    /// </summary>
    public string LauncherLabel { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the theme color.
    /// </summary>
    public string ThemeColor { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets whether the deployment is active and usable.
    /// </summary>
    public bool IsActive { get; set; }
}
