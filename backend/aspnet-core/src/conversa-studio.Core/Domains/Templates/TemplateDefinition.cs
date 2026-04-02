using System;
using Abp.Domain.Entities.Auditing;

namespace ConversaStudio.Domains.Templates;

/// <summary>
/// Represents a tenant-scoped reusable bot template with draft and published graph snapshots.
/// </summary>
public class TemplateDefinition : FullAuditedEntity<Guid>
{
    public const int MaxNameLength = 128;
    public const int MaxDescriptionLength = 1000;
    public const int MaxCategoryLength = 64;
    public const int MaxStatusLength = 32;

    /// <summary>
    /// Gets or sets the tenant that owns the template.
    /// </summary>
    public int? TenantId { get; set; }

    /// <summary>
    /// Gets or sets the admin user that created the template.
    /// </summary>
    public long OwnerUserId { get; set; }

    /// <summary>
    /// Gets or sets the template display name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the template summary description.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the template category shown in the library.
    /// </summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the current persisted lifecycle status.
    /// </summary>
    public string Status { get; set; } = TemplateStatus.Draft;

    /// <summary>
    /// Gets or sets the current editable draft version number.
    /// </summary>
    public int DraftVersion { get; set; }

    /// <summary>
    /// Gets or sets the published snapshot version number when the template is live.
    /// </summary>
    public int? PublishedVersion { get; set; }

    /// <summary>
    /// Gets or sets the serialized editable draft graph.
    /// </summary>
    public string DraftGraphJson { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the serialized published graph available to developers.
    /// </summary>
    public string PublishedGraphJson { get; set; } = string.Empty;

    /// <summary>
    /// Initializes a new empty instance for EF Core.
    /// </summary>
    public TemplateDefinition()
    {
    }

    /// <summary>
    /// Initializes a new persisted template definition.
    /// </summary>
    public TemplateDefinition(Guid id, int? tenantId, long ownerUserId, string name, string description, string category, string draftGraphJson)
    {
        Id = id;
        TenantId = tenantId;
        OwnerUserId = ownerUserId;
        Name = name;
        Description = description;
        Category = category;
        DraftGraphJson = draftGraphJson;
        Status = TemplateStatus.Draft;
        DraftVersion = 1;
    }

    /// <summary>
    /// Updates the editable draft graph and increments the draft version.
    /// </summary>
    public void UpdateDraft(string name, string description, string category, string draftGraphJson)
    {
        Name = name;
        Description = description;
        Category = category;
        DraftGraphJson = draftGraphJson;
        Status = TemplateStatus.Draft;
        DraftVersion += 1;
    }

    /// <summary>
    /// Publishes the current draft snapshot to the developer-facing template library.
    /// </summary>
    public void PublishDraft()
    {
        PublishedGraphJson = DraftGraphJson;
        PublishedVersion = DraftVersion;
        Status = TemplateStatus.Published;
    }

    /// <summary>
    /// Removes the current published snapshot while preserving the draft.
    /// </summary>
    public void Unpublish()
    {
        PublishedGraphJson = string.Empty;
        PublishedVersion = null;
        Status = TemplateStatus.Draft;
    }
}
