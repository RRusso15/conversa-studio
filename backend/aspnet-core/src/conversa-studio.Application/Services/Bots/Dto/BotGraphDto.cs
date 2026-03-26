using System.Collections.Generic;
using System.Text.Json;

namespace ConversaStudio.Services.Bots.Dto;

/// <summary>
/// Represents the transport contract for a persisted bot graph.
/// </summary>
public class BotGraphDto
{
    /// <summary>
    /// Gets or sets the graph metadata.
    /// </summary>
    public BotGraphMetadataDto Metadata { get; set; } = new();

    /// <summary>
    /// Gets or sets the graph nodes.
    /// </summary>
    public List<BotNodeDto> Nodes { get; set; } = [];

    /// <summary>
    /// Gets or sets the graph edges.
    /// </summary>
    public List<BotEdgeDto> Edges { get; set; } = [];
}

/// <summary>
/// Represents the transport metadata for a bot graph.
/// </summary>
public class BotGraphMetadataDto
{
    /// <summary>
    /// Gets or sets the frontend graph identifier.
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the display name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the lifecycle status.
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the version label.
    /// </summary>
    public string Version { get; set; } = string.Empty;
}

/// <summary>
/// Represents the transport contract for a graph node.
/// </summary>
public class BotNodeDto
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
    /// Gets or sets the node position.
    /// </summary>
    public BotNodePositionDto Position { get; set; } = new();

    /// <summary>
    /// Gets or sets the node configuration.
    /// </summary>
    public JsonElement Config { get; set; }
}

/// <summary>
/// Represents the transport position for a graph node.
/// </summary>
public class BotNodePositionDto
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
/// Represents the transport contract for a graph edge.
/// </summary>
public class BotEdgeDto
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
    /// Gets or sets the optional branch handle.
    /// </summary>
    public string SourceHandle { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the optional edge label.
    /// </summary>
    public string Label { get; set; } = string.Empty;
}
