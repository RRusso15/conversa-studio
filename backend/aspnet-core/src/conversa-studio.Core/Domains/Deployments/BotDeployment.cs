using System;
using Abp.Domain.Entities.Auditing;

namespace ConversaStudio.Domains.Deployments;

/// <summary>
/// Represents a tenant-scoped public deployment for a published bot.
/// </summary>
public class BotDeployment : FullAuditedEntity<Guid>
{
    public const int MaxNameLength = 128;
    public const int MaxStatusLength = 32;
    public const int MaxChannelTypeLength = 32;
    public const int MaxDeploymentKeyLength = 64;
    public const int MaxLauncherLabelLength = 64;
    public const int MaxThemeColorLength = 16;

    /// <summary>
    /// Gets or sets the tenant that owns the deployment.
    /// </summary>
    public int? TenantId { get; set; }

    /// <summary>
    /// Gets or sets the owning bot definition.
    /// </summary>
    public Guid BotDefinitionId { get; set; }

    /// <summary>
    /// Gets or sets the deployment display name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the public channel type.
    /// </summary>
    public string ChannelType { get; set; } = DeploymentChannelType.WebWidget;

    /// <summary>
    /// Gets or sets the lifecycle status.
    /// </summary>
    public string Status { get; set; } = BotDeploymentStatus.Draft;

    /// <summary>
    /// Gets or sets the public deployment key used by install/runtime surfaces.
    /// </summary>
    public string DeploymentKey { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the serialized allow-list of permitted domains.
    /// </summary>
    public string AllowedDomainsJson { get; set; } = "[]";

    /// <summary>
    /// Gets or sets the launcher label shown in the widget trigger.
    /// </summary>
    public string LauncherLabel { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the widget theme color.
    /// </summary>
    public string ThemeColor { get; set; } = "#2563EB";

    /// <summary>
    /// Initializes an empty instance for EF Core.
    /// </summary>
    public BotDeployment()
    {
    }

    /// <summary>
    /// Initializes a new widget deployment.
    /// </summary>
    public BotDeployment(
        Guid id,
        int? tenantId,
        Guid botDefinitionId,
        string name,
        string deploymentKey,
        string allowedDomainsJson,
        string launcherLabel,
        string themeColor)
    {
        Id = id;
        TenantId = tenantId;
        BotDefinitionId = botDefinitionId;
        Name = name;
        DeploymentKey = deploymentKey;
        AllowedDomainsJson = allowedDomainsJson;
        LauncherLabel = launcherLabel;
        ThemeColor = themeColor;
        ChannelType = DeploymentChannelType.WebWidget;
        Status = BotDeploymentStatus.Draft;
    }

    /// <summary>
    /// Updates editable deployment settings.
    /// </summary>
    public void UpdateSettings(string name, string allowedDomainsJson, string launcherLabel, string themeColor)
    {
        Name = name;
        AllowedDomainsJson = allowedDomainsJson;
        LauncherLabel = launcherLabel;
        ThemeColor = themeColor;
    }

    /// <summary>
    /// Marks the deployment active.
    /// </summary>
    public void Activate()
    {
        Status = BotDeploymentStatus.Active;
    }

    /// <summary>
    /// Marks the deployment inactive.
    /// </summary>
    public void Deactivate()
    {
        Status = BotDeploymentStatus.Inactive;
    }
}
