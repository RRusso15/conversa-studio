using System;
using Abp.Domain.Entities.Auditing;

namespace ConversaStudio.Domains.Transcripts;

/// <summary>
/// Represents one persisted user or bot message produced during live runtime execution.
/// </summary>
public class TranscriptMessage : CreationAuditedEntity<Guid>
{
    public const int MaxRoleLength = 16;
    public const int MaxContentLength = 8000;

    /// <summary>
    /// Gets or sets the owning tenant identifier.
    /// </summary>
    public int? TenantId { get; set; }

    /// <summary>
    /// Gets or sets the deployment identifier.
    /// </summary>
    public Guid BotDeploymentId { get; set; }

    /// <summary>
    /// Gets or sets the bot definition identifier.
    /// </summary>
    public Guid BotDefinitionId { get; set; }

    /// <summary>
    /// Gets or sets the runtime session identifier.
    /// </summary>
    public Guid RuntimeSessionId { get; set; }

    /// <summary>
    /// Gets or sets the message role.
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the message content.
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Initializes an empty EF Core instance.
    /// </summary>
    public TranscriptMessage()
    {
    }

    /// <summary>
    /// Initializes a transcript message.
    /// </summary>
    public TranscriptMessage(Guid id, int? tenantId, Guid botDeploymentId, Guid botDefinitionId, Guid runtimeSessionId, string role, string content)
    {
        Id = id;
        TenantId = tenantId;
        BotDeploymentId = botDeploymentId;
        BotDefinitionId = botDefinitionId;
        RuntimeSessionId = runtimeSessionId;
        Role = role;
        Content = content;
    }
}
