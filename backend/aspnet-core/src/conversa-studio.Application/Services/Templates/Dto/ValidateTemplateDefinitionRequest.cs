using ConversaStudio.Services.Bots.Dto;
using System.ComponentModel.DataAnnotations;

namespace ConversaStudio.Services.Templates.Dto;

/// <summary>
/// Validates a template graph without persisting it.
/// </summary>
public class ValidateTemplateDefinitionRequest
{
    [Required]
    public BotGraphDto Graph { get; set; } = new();
}
