using System;
using Abp.Domain.Entities.Auditing;

namespace ConversaStudio.Domains.Bots;

/// <summary>
/// Represents a tenant-scoped bot definition and its editable draft graph.
/// </summary>
public class BotDefinition : FullAuditedEntity<Guid>
{
    public const int MaxNameLength = 128;
    public const int MaxStatusLength = 32;

    /// <summary>
    /// Gets or sets the tenant that owns the bot.
    /// </summary>
    public int? TenantId { get; set; }

    /// <summary>
    /// Gets or sets the owning user for the bot.
    /// </summary>
    public long OwnerUserId { get; set; }

    /// <summary>
    /// Gets or sets the bot display name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the current persisted lifecycle status.
    /// </summary>
    public string Status { get; set; } = BotStatus.Draft;

    /// <summary>
    /// Gets or sets the current editable draft version number.
    /// </summary>
    public int DraftVersion { get; set; }

    /// <summary>
    /// Gets or sets the published snapshot version number when publishing is introduced.
    /// </summary>
    public int? PublishedVersion { get; set; }

    /// <summary>
    /// Gets or sets the serialized editable draft graph.
    /// </summary>
    public string DraftGraphJson { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the serialized published graph when publishing is introduced.
    /// </summary>
    public string PublishedGraphJson { get; set; } = string.Empty;

    /// <summary>
    /// Initializes a new empty instance for EF Core.
    /// </summary>
    public BotDefinition()
    {
    }

    /// <summary>
    /// Initializes a new persisted bot definition.
    /// </summary>
    public BotDefinition(Guid id, int? tenantId, long ownerUserId, string name, string draftGraphJson)
    {
        Id = id;
        TenantId = tenantId;
        OwnerUserId = ownerUserId;
        Name = name;
        DraftGraphJson = draftGraphJson;
        Status = BotStatus.Draft;
        DraftVersion = 1;
    }

    /// <summary>
    /// Updates the editable draft graph and increments the draft version.
    /// </summary>
    public void UpdateDraft(string name, string draftGraphJson)
    {
        Name = name;
        DraftGraphJson = draftGraphJson;
        Status = BotStatus.Draft;
        DraftVersion += 1;
    }
}
