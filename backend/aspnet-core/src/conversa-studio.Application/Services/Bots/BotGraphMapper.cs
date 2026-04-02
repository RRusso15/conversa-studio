using System.Linq;
using System.Text.Json;
using ConversaStudio.Domains.Bots;
using ConversaStudio.Services.Bots.Dto;

namespace ConversaStudio.Services.Bots;

/// <summary>
/// Maps bot graph contracts between transport DTOs, domain models, and JSON storage.
/// </summary>
public static class BotGraphMapper
{
    public static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    /// <summary>
    /// Maps a transport graph into the domain graph shape.
    /// </summary>
    public static BotGraphDefinition MapToDomainGraph(BotGraphDto graph)
    {
        return new BotGraphDefinition
        {
            Metadata = new BotGraphMetadata
            {
                Id = graph.Metadata.Id,
                Name = graph.Metadata.Name,
                Status = graph.Metadata.Status,
                Version = graph.Metadata.Version,
                HandoffInboxes = graph.Metadata.HandoffInboxes.Select(inbox => new BotHandoffInboxDefinition
                {
                    Key = inbox.Key,
                    Label = inbox.Label,
                    Email = inbox.Email
                }).ToList()
            },
            Nodes = graph.Nodes.Select(node => new BotNodeDefinition
            {
                Id = node.Id,
                Type = node.Type,
                Label = node.Label,
                Position = new BotNodePosition
                {
                    X = node.Position.X,
                    Y = node.Position.Y
                },
                Config = node.Config
            }).ToList(),
            Edges = graph.Edges.Select(edge => new BotEdgeDefinition
            {
                Id = edge.Id,
                Source = edge.Source,
                Target = edge.Target,
                SourceHandle = edge.SourceHandle,
                Label = edge.Label
            }).ToList()
        };
    }

    /// <summary>
    /// Maps a domain graph into the transport DTO shape.
    /// </summary>
    public static BotGraphDto MapToDto(BotGraphDefinition graph)
    {
        return new BotGraphDto
        {
            Metadata = new BotGraphMetadataDto
            {
                Id = graph.Metadata.Id,
                Name = graph.Metadata.Name,
                Status = graph.Metadata.Status,
                Version = graph.Metadata.Version,
                HandoffInboxes = graph.Metadata.HandoffInboxes.Select(inbox => new BotHandoffInboxDto
                {
                    Key = inbox.Key,
                    Label = inbox.Label,
                    Email = inbox.Email
                }).ToList()
            },
            Nodes = graph.Nodes.Select(node => new BotNodeDto
            {
                Id = node.Id,
                Type = node.Type,
                Label = node.Label,
                Position = new BotNodePositionDto
                {
                    X = node.Position.X,
                    Y = node.Position.Y
                },
                Config = node.Config
            }).ToList(),
            Edges = graph.Edges.Select(edge => new BotEdgeDto
            {
                Id = edge.Id,
                Source = edge.Source,
                Target = edge.Target,
                SourceHandle = edge.SourceHandle,
                Label = edge.Label
            }).ToList()
        };
    }

    /// <summary>
    /// Serializes a domain graph for storage.
    /// </summary>
    public static string Serialize(BotGraphDefinition graph)
    {
        return JsonSerializer.Serialize(graph, SerializerOptions);
    }

    /// <summary>
    /// Deserializes a stored graph snapshot.
    /// </summary>
    public static BotGraphDefinition Deserialize(string graphJson)
    {
        return JsonSerializer.Deserialize<BotGraphDefinition>(graphJson, SerializerOptions) ?? new BotGraphDefinition();
    }
}
