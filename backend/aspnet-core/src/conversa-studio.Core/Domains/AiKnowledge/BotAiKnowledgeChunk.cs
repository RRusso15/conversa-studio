using System.Collections.Generic;

namespace ConversaStudio.Domains.AiKnowledge;

/// <summary>
/// Represents a single embedded chunk of knowledge content.
/// </summary>
public class BotAiKnowledgeChunk
{
    /// <summary>
    /// Gets or sets the chunk order within the source.
    /// </summary>
    public int Index { get; set; }

    /// <summary>
    /// Gets or sets the chunk text.
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the numeric embedding vector.
    /// </summary>
    public List<float> Embedding { get; set; } = [];
}
