using System;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using ConversaStudio.Services.Bots.Dto;

namespace ConversaStudio.Services.Bots;

/// <summary>
/// Defines application-level bot definition workflows for the builder.
/// </summary>
public interface IBotDefinitionAppService : IApplicationService
{
    /// <summary>
    /// Returns the current user's bots for the active tenant scope.
    /// </summary>
    Task<ListResultDto<BotSummaryDto>> GetBots();

    /// <summary>
    /// Returns a single bot definition for editing.
    /// </summary>
    Task<BotDefinitionDto> GetBot(EntityDto<Guid> input);

    /// <summary>
    /// Creates a new draft bot definition.
    /// </summary>
    Task<BotDefinitionDto> CreateDraft(CreateBotDefinitionRequest input);

    /// <summary>
    /// Updates an existing draft bot definition.
    /// </summary>
    Task<BotDefinitionDto> UpdateDraft(UpdateBotDefinitionRequest input);

    /// <summary>
    /// Publishes the current draft snapshot.
    /// </summary>
    Task<BotDefinitionDto> PublishDraft(EntityDto<Guid> input);

    /// <summary>
    /// Removes the currently published snapshot.
    /// </summary>
    Task<BotDefinitionDto> Unpublish(EntityDto<Guid> input);

    /// <summary>
    /// Validates a bot graph without persisting it.
    /// </summary>
    Task<ListResultDto<BotValidationResultDto>> ValidateDraft(ValidateBotDefinitionRequest input);
}
