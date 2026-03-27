namespace ConversaStudio.Services.Bots.Dto;

/// <summary>
/// Defines the request contract for creating a draft bot definition.
/// </summary>
public class CreateBotDefinitionRequest
{
    /// <summary>
    /// Gets or sets the bot name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the draft graph to persist.
    /// </summary>
    public BotGraphDto Graph { get; set; } = new();
}
