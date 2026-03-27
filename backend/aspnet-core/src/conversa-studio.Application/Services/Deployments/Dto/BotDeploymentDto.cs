using System;
using System.Collections.Generic;

namespace ConversaStudio.Services.Deployments.Dto;

/// <summary>
/// Represents a persisted widget deployment.
/// </summary>
public class BotDeploymentDto
{
    /// <summary>
    /// Gets or sets the deployment identifier.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the owning bot identifier.
    /// </summary>
    public Guid BotDefinitionId { get; set; }

    /// <summary>
    /// Gets or sets the owning bot name.
    /// </summary>
    public string BotName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the deployment display name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the public channel type.
    /// </summary>
    public string ChannelType { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the lifecycle status.
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the public deployment key.
    /// </summary>
    public string DeploymentKey { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the allowed domains.
    /// </summary>
    public List<string> AllowedDomains { get; set; } = [];

    /// <summary>
    /// Gets or sets the launcher label.
    /// </summary>
    public string LauncherLabel { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the theme color.
    /// </summary>
    public string ThemeColor { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the last updated timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
