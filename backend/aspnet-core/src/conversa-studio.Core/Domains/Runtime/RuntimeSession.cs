using System;
using Abp.Domain.Entities.Auditing;

namespace ConversaStudio.Domains.Runtime;

/// <summary>
/// Represents persisted execution state for a live widget conversation session.
/// </summary>
public class RuntimeSession : FullAuditedEntity<Guid>
{
    public const int MaxSessionTokenLength = 64;
    public const int MaxNodeIdLength = 128;
    public const int MaxVariablePayloadLength = 16000;

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
    /// Gets or sets the published bot version used when the session started.
    /// </summary>
    public int PublishedVersion { get; set; }

    /// <summary>
    /// Gets or sets the public session token.
    /// </summary>
    public string SessionToken { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the current node identifier.
    /// </summary>
    public string CurrentNodeId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the serialized variable state.
    /// </summary>
    public string VariablesJson { get; set; } = "{}";

    /// <summary>
    /// Gets or sets whether the runtime is waiting for user input.
    /// </summary>
    public bool AwaitingInput { get; set; }

    /// <summary>
    /// Gets or sets the pending question variable when input is awaited.
    /// </summary>
    public string PendingQuestionVariable { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets whether the session has completed.
    /// </summary>
    public bool IsCompleted { get; set; }

    /// <summary>
    /// Initializes an empty EF Core instance.
    /// </summary>
    public RuntimeSession()
    {
    }

    /// <summary>
    /// Initializes a new runtime session.
    /// </summary>
    public RuntimeSession(Guid id, int? tenantId, Guid botDeploymentId, Guid botDefinitionId, int publishedVersion, string sessionToken)
    {
        Id = id;
        TenantId = tenantId;
        BotDeploymentId = botDeploymentId;
        BotDefinitionId = botDefinitionId;
        PublishedVersion = publishedVersion;
        SessionToken = sessionToken;
        VariablesJson = "{}";
    }

    /// <summary>
    /// Updates the persisted execution state.
    /// </summary>
    public void UpdateState(string currentNodeId, string variablesJson, bool awaitingInput, string pendingQuestionVariable, bool isCompleted)
    {
        CurrentNodeId = currentNodeId ?? string.Empty;
        VariablesJson = string.IsNullOrWhiteSpace(variablesJson) ? "{}" : variablesJson;
        AwaitingInput = awaitingInput;
        PendingQuestionVariable = pendingQuestionVariable ?? string.Empty;
        IsCompleted = isCompleted;
    }
}
