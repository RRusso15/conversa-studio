using ConversaStudio.Services.Bots.Dto;

namespace ConversaStudio.Services.Templates.Dto;

/// <summary>
/// Represents a full template definition and graph payload.
/// </summary>
public class TemplateDefinitionDto : TemplateSummaryDto
{
    public BotGraphDto Graph { get; set; } = new();
}
