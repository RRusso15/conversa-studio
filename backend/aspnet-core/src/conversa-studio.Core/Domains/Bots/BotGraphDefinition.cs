using System.Collections.Generic;
using System.Text.Json;

namespace ConversaStudio.Domains.Bots;

/// <summary>
/// Represents a complete persisted bot graph definition.
/// </summary>
public class BotGraphDefinition
{
    /// <summary>
    /// Gets or sets the graph metadata.
    /// </summary>
    public BotGraphMetadata Metadata { get; set; } = new();

    /// <summary>
    /// Gets or sets the nodes in the graph.
    /// </summary>
    public List<BotNodeDefinition> Nodes { get; set; } = [];

    /// <summary>
    /// Gets or sets the edges in the graph.
    /// </summary>
    public List<BotEdgeDefinition> Edges { get; set; } = [];
}

/// <summary>
/// Represents persisted metadata for a bot graph.
/// </summary>
public class BotGraphMetadata
{
    /// <summary>
    /// Gets or sets the bot identifier used in the frontend graph payload.
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the display name of the bot.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the graph status.
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the draft version label.
    /// </summary>
    public string Version { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the named handoff inboxes available to this bot.
    /// </summary>
    public List<BotHandoffInboxDefinition> HandoffInboxes { get; set; } = [];
}

/// <summary>
/// Represents one named handoff inbox configured for a bot.
/// </summary>
public class BotHandoffInboxDefinition
{
    /// <summary>
    /// Gets or sets the stable inbox key used by handoff nodes.
    /// </summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the display label shown in the builder.
    /// </summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the recipient email for this inbox.
    /// </summary>
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// Represents a node within a bot graph.
/// </summary>
public class BotNodeDefinition
{
    /// <summary>
    /// Gets or sets the node identifier.
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the node type.
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the node label.
    /// </summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the rendered position for the node.
    /// </summary>
    public BotNodePosition Position { get; set; } = new();

    /// <summary>
    /// Gets or sets the type-specific node configuration.
    /// </summary>
    public JsonElement Config { get; set; }
}

/// <summary>
/// Represents the persisted position of a node.
/// </summary>
public class BotNodePosition
{
    /// <summary>
    /// Gets or sets the horizontal coordinate.
    /// </summary>
    public double X { get; set; }

    /// <summary>
    /// Gets or sets the vertical coordinate.
    /// </summary>
    public double Y { get; set; }
}

/// <summary>
/// Represents a directed edge between two nodes.
/// </summary>
public class BotEdgeDefinition
{
    /// <summary>
    /// Gets or sets the edge identifier.
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the source node identifier.
    /// </summary>
    public string Source { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the target node identifier.
    /// </summary>
    public string Target { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the optional source handle used for branching edges.
    /// </summary>
    public string SourceHandle { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the optional edge label.
    /// </summary>
    public string Label { get; set; } = string.Empty;
}
