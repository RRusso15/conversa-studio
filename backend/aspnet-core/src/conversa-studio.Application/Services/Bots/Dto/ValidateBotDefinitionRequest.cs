namespace ConversaStudio.Services.Bots.Dto;

/// <summary>
/// Defines the request contract for validating a bot graph.
/// </summary>
public class ValidateBotDefinitionRequest
{
    /// <summary>
    /// Gets or sets the graph to validate.
    /// </summary>
    public BotGraphDto Graph { get; set; } = new();
}
