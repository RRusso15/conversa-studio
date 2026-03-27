using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ConversaStudio.Services.Deployments.Dto;

/// <summary>
/// Defines the request contract for creating a widget deployment.
/// </summary>
public class CreateBotDeploymentRequest
{
    /// <summary>
    /// Gets or sets the owning bot identifier.
    /// </summary>
    [Required]
    public Guid BotDefinitionId { get; set; }

    /// <summary>
    /// Gets or sets the deployment display name.
    /// </summary>
    [Required]
    [MaxLength(128)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the allowed embed domains.
    /// </summary>
    public List<string> AllowedDomains { get; set; } = [];

    /// <summary>
    /// Gets or sets the launcher label.
    /// </summary>
    [MaxLength(64)]
    public string LauncherLabel { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the widget theme color.
    /// </summary>
    [MaxLength(16)]
    public string ThemeColor { get; set; } = "#2563EB";
}
