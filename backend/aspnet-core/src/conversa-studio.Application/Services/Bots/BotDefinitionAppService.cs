using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using ConversaStudio.Authorization;
using ConversaStudio.Domains.AiKnowledge;
using ConversaStudio.Domains.Bots;
using ConversaStudio.Services.AiKnowledge.Dto;
using ConversaStudio.Services.Bots.Dto;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConversaStudio.Services.Bots;

/// <summary>
/// Orchestrates bot definition CRUD and validation for the builder experience.
/// </summary>
[AbpAuthorize(PermissionNames.Pages_Bots)]
public class BotDefinitionAppService : ConversaStudioAppServiceBase, IBotDefinitionAppService
{
    private static readonly JsonSerializerOptions GraphSerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    private readonly IRepository<BotDefinition, Guid> _botDefinitionRepository;
    private readonly BotGraphValidator _botGraphValidator;

    public BotDefinitionAppService(
        IRepository<BotDefinition, Guid> botDefinitionRepository,
        BotGraphValidator botGraphValidator)
    {
        _botDefinitionRepository = botDefinitionRepository;
        _botGraphValidator = botGraphValidator;
    }

    /// <summary>
    /// Returns the current user's bots for the active tenant scope.
    /// </summary>
    [HttpGet]
    public async Task<ListResultDto<BotSummaryDto>> GetBots()
    {
        var currentUser = await GetCurrentUserAsync();
        var bots = await _botDefinitionRepository.GetAll()
            .Where(bot => bot.TenantId == AbpSession.TenantId && bot.OwnerUserId == currentUser.Id)
            .OrderByDescending(bot => bot.LastModificationTime ?? bot.CreationTime)
            .ToListAsync();

        return new ListResultDto<BotSummaryDto>(bots.Select(MapToSummaryDto).ToList());
    }

    /// <summary>
    /// Returns a single bot definition for editing.
    /// </summary>
    [HttpGet]
    public async Task<BotDefinitionDto> GetBot(EntityDto<Guid> input)
    {
        var bot = await GetOwnedBotAsync(input.Id);
        return MapToDefinitionDto(bot);
    }

    /// <summary>
    /// Creates a new draft bot definition.
    /// </summary>
    [HttpPost]
    public async Task<BotDefinitionDto> CreateDraft(CreateBotDefinitionRequest input)
    {
        var currentUser = await GetCurrentUserAsync();
        var graph = MapToDomainGraph(input.Graph);
        ThrowIfInvalid(graph);

        var bot = new BotDefinition(
            Guid.NewGuid(),
            AbpSession.TenantId,
            currentUser.Id,
            ResolveBotName(input.Name, graph.Metadata.Name),
            SerializeGraph(graph));

        await _botDefinitionRepository.InsertAsync(bot);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDefinitionDto(bot, graph);
    }

    /// <summary>
    /// Updates an existing draft bot definition.
    /// </summary>
    [HttpPut]
    public async Task<BotDefinitionDto> UpdateDraft(UpdateBotDefinitionRequest input)
    {
        var bot = await GetOwnedBotAsync(input.Id);
        var graph = MapToDomainGraph(input.Graph);
        ThrowIfInvalid(graph);

        bot.UpdateDraft(ResolveBotName(input.Name, graph.Metadata.Name), SerializeGraph(graph));
        await _botDefinitionRepository.UpdateAsync(bot);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDefinitionDto(bot, graph);
    }

    /// <summary>
    /// Publishes the current draft snapshot for deployment use.
    /// </summary>
    [HttpPost]
    public async Task<BotDefinitionDto> PublishDraft(EntityDto<Guid> input)
    {
        var bot = await GetOwnedBotAsync(input.Id);
        var graph = DeserializeGraph(bot.DraftGraphJson);
        ThrowIfInvalid(graph);
        ThrowIfAiKnowledgeNotReadyForPublish(bot, graph);

        bot.PublishDraft();
        await _botDefinitionRepository.UpdateAsync(bot);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDefinitionDto(bot, graph);
    }

    /// <summary>
    /// Removes the currently published snapshot while preserving the draft.
    /// </summary>
    [HttpPost]
    public async Task<BotDefinitionDto> Unpublish(EntityDto<Guid> input)
    {
        var bot = await GetOwnedBotAsync(input.Id);
        var graph = DeserializeGraph(bot.DraftGraphJson);

        bot.Unpublish();
        await _botDefinitionRepository.UpdateAsync(bot);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDefinitionDto(bot, graph);
    }

    /// <summary>
    /// Validates a bot graph without persisting it.
    /// </summary>
    [HttpPost]
    public async Task<ListResultDto<BotValidationResultDto>> ValidateDraft(ValidateBotDefinitionRequest input)
    {
        await GetCurrentUserAsync();
        var graph = MapToDomainGraph(input.Graph);
        var results = _botGraphValidator.Validate(graph)
            .Concat(await GetAiValidationIssuesAsync(input.Id, graph))
            .Select(issue => new BotValidationResultDto
            {
                Id = issue.Id,
                Severity = issue.Severity,
                Message = issue.Message,
                RelatedNodeId = issue.RelatedNodeId,
                RelatedEdgeId = issue.RelatedEdgeId
            })
            .ToList();

        return new ListResultDto<BotValidationResultDto>(results);
    }

    private async Task<BotDefinition> GetOwnedBotAsync(Guid botId)
    {
        var currentUser = await GetCurrentUserAsync();
        var bot = await _botDefinitionRepository.FirstOrDefaultAsync(
            candidate => candidate.Id == botId &&
                         candidate.TenantId == AbpSession.TenantId &&
                         candidate.OwnerUserId == currentUser.Id);

        if (bot == null)
        {
            throw new UserFriendlyException("The requested bot could not be found.");
        }

        return bot;
    }

    private void ThrowIfInvalid(BotGraphDefinition graph)
    {
        var blockingIssues = _botGraphValidator.Validate(graph)
            .Where(issue => issue.Severity == BotValidationSeverity.Error)
            .ToList();
        if (blockingIssues.Count == 0)
        {
            return;
        }

        throw new UserFriendlyException(string.Join(" ", blockingIssues.Select(issue => issue.Message).Distinct()));
    }

    private async Task<List<BotValidationIssue>> GetAiValidationIssuesAsync(Guid? botId, BotGraphDefinition graph)
    {
        if (!GraphContainsAiNode(graph))
        {
            return [];
        }

        if (!botId.HasValue)
        {
            return
            [
                new BotValidationIssue
                {
                    Id = "ai-bot-persist-warning",
                    Severity = BotValidationSeverity.Warning,
                    Message = "Save this bot first, then configure the shared AI knowledge hub for its AI nodes."
                }
            ];
        }

        var bot = await GetOwnedBotAsync(botId.Value);
        return BuildAiKnowledgeIssues(bot, graph, forPublish: false);
    }

    private static bool GraphContainsAiNode(BotGraphDefinition graph)
    {
        return graph.Nodes.Any(node => string.Equals(node.Type, "ai", StringComparison.OrdinalIgnoreCase));
    }

    private static void ThrowIfAiKnowledgeNotReadyForPublish(BotDefinition bot, BotGraphDefinition graph)
    {
        var blockingIssues = BuildAiKnowledgeIssues(bot, graph, forPublish: true)
            .Where(issue => issue.Severity == BotValidationSeverity.Error)
            .ToList();

        if (blockingIssues.Count == 0)
        {
            return;
        }

        throw new UserFriendlyException(string.Join(" ", blockingIssues.Select(issue => issue.Message).Distinct()));
    }

    private static List<BotValidationIssue> BuildAiKnowledgeIssues(BotDefinition bot, BotGraphDefinition graph, bool forPublish)
    {
        if (!GraphContainsAiNode(graph))
        {
            return [];
        }

        var issues = new List<BotValidationIssue>();
        var knowledge = DeserializeAiKnowledge(bot.AiKnowledgeJson);
        var readySourceCount = knowledge.Sources.Count(source =>
            string.Equals(source.Status, BotAiKnowledgeSourceStatus.Ready, StringComparison.OrdinalIgnoreCase) &&
            source.Chunks.Count > 0);
        var severity = forPublish ? BotValidationSeverity.Error : BotValidationSeverity.Warning;

        if (string.IsNullOrWhiteSpace(bot.AiApiKeyEncrypted))
        {
            issues.Add(new BotValidationIssue
            {
                Id = "ai-provider-key-missing",
                Severity = severity,
                Message = "AI nodes require a configured Gemini API key for this bot."
            });
        }

        if (readySourceCount == 0)
        {
            issues.Add(new BotValidationIssue
            {
                Id = "ai-knowledge-missing",
                Severity = severity,
                Message = "AI nodes require at least one ready knowledge source for this bot."
            });
        }

        return issues;
    }

    private static string ResolveBotName(string requestName, string graphName)
    {
        var resolvedName = !string.IsNullOrWhiteSpace(requestName) ? requestName.Trim() : graphName.Trim();
        return string.IsNullOrWhiteSpace(resolvedName) ? "Untitled Bot" : resolvedName;
    }

    private static string SerializeGraph(BotGraphDefinition graph)
    {
        return JsonSerializer.Serialize(graph, GraphSerializerOptions);
    }

    private static BotGraphDefinition DeserializeGraph(string graphJson)
    {
        return JsonSerializer.Deserialize<BotGraphDefinition>(graphJson, GraphSerializerOptions) ?? new BotGraphDefinition();
    }

    private static BotGraphDefinition MapToDomainGraph(BotGraphDto graph)
    {
        return new BotGraphDefinition
        {
            Metadata = new BotGraphMetadata
            {
                Id = graph.Metadata.Id,
                Name = graph.Metadata.Name,
                Status = graph.Metadata.Status,
                Version = graph.Metadata.Version
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

    private static BotGraphDto MapToGraphDto(BotGraphDefinition graph)
    {
        return new BotGraphDto
        {
            Metadata = new BotGraphMetadataDto
            {
                Id = graph.Metadata.Id,
                Name = graph.Metadata.Name,
                Status = graph.Metadata.Status,
                Version = graph.Metadata.Version
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

    private static BotSummaryDto MapToSummaryDto(BotDefinition bot)
    {
        return new BotSummaryDto
        {
            Id = bot.Id,
            Name = bot.Name,
            Status = bot.Status,
            DraftVersion = bot.DraftVersion,
            PublishedVersion = bot.PublishedVersion,
            HasUnpublishedChanges = !bot.PublishedVersion.HasValue || bot.PublishedVersion.Value != bot.DraftVersion,
            UpdatedAt = bot.LastModificationTime ?? bot.CreationTime
        };
    }

    private static BotDefinitionDto MapToDefinitionDto(BotDefinition bot, BotGraphDefinition graph = null)
    {
        var resolvedGraph = graph ?? DeserializeGraph(bot.DraftGraphJson);
        var knowledge = DeserializeAiKnowledge(bot.AiKnowledgeJson);
        var readySourceCount = knowledge.Sources.Count(source =>
            string.Equals(source.Status, BotAiKnowledgeSourceStatus.Ready, StringComparison.OrdinalIgnoreCase) &&
            source.Chunks.Count > 0);

        resolvedGraph.Metadata.Id = bot.Id.ToString();
        resolvedGraph.Metadata.Name = bot.Name;
        resolvedGraph.Metadata.Status = bot.Status.ToLowerInvariant();
        resolvedGraph.Metadata.Version = $"v{bot.DraftVersion}";

        return new BotDefinitionDto
        {
            Id = bot.Id,
            Name = bot.Name,
            Status = bot.Status,
            DraftVersion = bot.DraftVersion,
            PublishedVersion = bot.PublishedVersion,
            HasUnpublishedChanges = !bot.PublishedVersion.HasValue || bot.PublishedVersion.Value != bot.DraftVersion,
            UpdatedAt = bot.LastModificationTime ?? bot.CreationTime,
            Graph = MapToGraphDto(resolvedGraph),
            AiKnowledge = new BotAiKnowledgeDto
            {
                BotId = bot.Id,
                Provider = string.IsNullOrWhiteSpace(bot.AiProvider) ? "gemini" : bot.AiProvider,
                GenerationModel = string.IsNullOrWhiteSpace(bot.AiGenerationModel) ? "gemini-2.5-flash" : bot.AiGenerationModel,
                EmbeddingModel = string.IsNullOrWhiteSpace(bot.AiEmbeddingModel) ? "gemini-embedding-001" : bot.AiEmbeddingModel,
                HasApiKey = !string.IsNullOrWhiteSpace(bot.AiApiKeyEncrypted),
                SourceCount = knowledge.Sources.Count,
                ReadySourceCount = readySourceCount,
                IsKnowledgeConfigured = !string.IsNullOrWhiteSpace(bot.AiApiKeyEncrypted) && readySourceCount > 0,
                Sources = knowledge.Sources.Select(source => new BotAiKnowledgeSourceDto
                {
                    Id = source.Id,
                    SourceType = source.SourceType,
                    Title = source.Title,
                    Status = source.Status,
                    FailureReason = source.FailureReason,
                    SourceUrl = source.SourceUrl,
                    SourceFileName = source.SourceFileName,
                    LastIngestedAtUtc = source.LastIngestedAtUtc,
                    ChunkCount = source.Chunks.Count
                }).ToList()
            }
        };
    }

    private static BotAiKnowledgeSnapshot DeserializeAiKnowledge(string knowledgeJson)
    {
        return JsonSerializer.Deserialize<BotAiKnowledgeSnapshot>(knowledgeJson ?? string.Empty, GraphSerializerOptions)
               ?? new BotAiKnowledgeSnapshot();
    }
}
