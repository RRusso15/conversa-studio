using System.Collections.Generic;

namespace ConversaStudio.Services.Bots.Dto;

/// <summary>
/// Returns a generated graph and any non-blocking generation notes.
/// </summary>
public class GeneratedBotGraphDto
{
    public BotGraphDto Graph { get; set; } = new();

    public string Model { get; set; } = string.Empty;

    public List<string> Notes { get; set; } = [];
}
