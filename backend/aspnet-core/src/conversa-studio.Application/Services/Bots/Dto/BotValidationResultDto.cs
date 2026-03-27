namespace ConversaStudio.Services.Bots.Dto;

/// <summary>
/// Represents a validation issue returned to the frontend.
/// </summary>
public class BotValidationResultDto
{
    /// <summary>
    /// Gets or sets the issue identifier.
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the issue severity.
    /// </summary>
    public string Severity { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the issue message.
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
