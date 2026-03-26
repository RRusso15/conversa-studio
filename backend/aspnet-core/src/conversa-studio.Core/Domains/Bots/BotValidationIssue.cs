namespace ConversaStudio.Domains.Bots;

/// <summary>
/// Represents a single validation issue detected in a bot graph.
/// </summary>
public class BotValidationIssue
{
    /// <summary>
    /// Gets or sets the stable identifier for the issue.
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the issue severity.
    /// </summary>
    public string Severity { get; set; } = BotValidationSeverity.Error;

    /// <summary>
    /// Gets or sets the human-readable validation message.
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the related node identifier when applicable.
    /// </summary>
    public string RelatedNodeId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the related edge identifier when applicable.
    /// </summary>
    public string RelatedEdgeId { get; set; } = string.Empty;
}
