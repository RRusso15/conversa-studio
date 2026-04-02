using System.ComponentModel.DataAnnotations;

namespace ConversaStudio.Services.Bots.Dto;

/// <summary>
/// Requests a generated bot graph from a natural-language prompt.
/// </summary>
public class GenerateBotGraphFromPromptRequest
{
    [Required]
    [StringLength(4000)]
    public string Prompt { get; set; } = string.Empty;

    [StringLength(128)]
    public string BotName { get; set; } = string.Empty;

    [Required]
    public string ApiKey { get; set; } = string.Empty;
}
