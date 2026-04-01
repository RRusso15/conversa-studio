namespace ConversaStudio.Domains.AiKnowledge;

/// <summary>
/// Defines the supported lifecycle states for a knowledge source.
/// </summary>
public static class BotAiKnowledgeSourceStatus
{
    public const string Processing = "processing";

    public const string Ready = "ready";

    public const string Failed = "failed";
}
