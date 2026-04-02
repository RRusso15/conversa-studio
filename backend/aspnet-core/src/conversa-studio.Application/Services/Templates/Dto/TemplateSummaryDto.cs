using System;

namespace ConversaStudio.Services.Templates.Dto;

/// <summary>
/// Represents template metadata shown in admin and developer template lists.
/// </summary>
public class TemplateSummaryDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public int DraftVersion { get; set; }

    public int? PublishedVersion { get; set; }

    public bool HasUnpublishedChanges { get; set; }

    public DateTime UpdatedAt { get; set; }
}
