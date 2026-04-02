using System;
using System.ComponentModel.DataAnnotations;
using ConversaStudio.Services.Bots.Dto;

namespace ConversaStudio.Services.Templates.Dto;

/// <summary>
/// Updates an existing reusable template draft.
/// </summary>
public class UpdateTemplateDefinitionRequest
{
    [Required]
    public Guid Id { get; set; }

    [Required]
    [StringLength(128)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    [StringLength(64)]
    public string Category { get; set; } = string.Empty;

    [Required]
    public BotGraphDto Graph { get; set; } = new();
}
