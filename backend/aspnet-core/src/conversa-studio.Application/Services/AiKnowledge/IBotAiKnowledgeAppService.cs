using System;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using ConversaStudio.Services.AiKnowledge.Dto;

namespace ConversaStudio.Services.AiKnowledge;

/// <summary>
/// Manages bot-scoped AI settings and knowledge sources outside the graph JSON.
/// </summary>
public interface IBotAiKnowledgeAppService : IApplicationService
{
    /// <summary>
    /// Returns the current bot-scoped AI configuration and sources.
    /// </summary>
    Task<BotAiKnowledgeDto> GetAsync(EntityDto<Guid> input);

    /// <summary>
    /// Updates the bot-scoped provider settings.
    /// </summary>
    Task<BotAiKnowledgeDto> UpsertSettingsAsync(UpsertBotAiSettingsRequest input);

    /// <summary>
    /// Adds a pasted text knowledge source.
    /// </summary>
    Task<BotAiKnowledgeDto> AddTextSourceAsync(AddBotAiTextSourceRequest input);

    /// <summary>
    /// Adds a single-page URL knowledge source.
    /// </summary>
    Task<BotAiKnowledgeDto> AddUrlSourceAsync(AddBotAiUrlSourceRequest input);

    /// <summary>
    /// Adds a PDF knowledge source.
    /// </summary>
    Task<BotAiKnowledgeDto> AddPdfSourceAsync(AddBotAiPdfSourceRequest input);

    /// <summary>
    /// Re-ingests an existing source.
    /// </summary>
    Task<BotAiKnowledgeDto> ReingestSourceAsync(ManageBotAiSourceRequest input);

    /// <summary>
    /// Deletes an existing source.
    /// </summary>
    Task<BotAiKnowledgeDto> DeleteSourceAsync(ManageBotAiSourceRequest input);
}
