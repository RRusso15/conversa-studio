using System.Collections.Generic;

namespace ConversaStudio.Domains.AiKnowledge;

/// <summary>
/// Represents the serialized bot-scoped knowledge snapshot stored outside the graph JSON.
/// </summary>
public class BotAiKnowledgeSnapshot
{
    /// <summary>
    /// Gets or sets the known sources for the bot.
    /// </summary>
    public List<BotAiKnowledgeSource> Sources { get; set; } = [];
}
