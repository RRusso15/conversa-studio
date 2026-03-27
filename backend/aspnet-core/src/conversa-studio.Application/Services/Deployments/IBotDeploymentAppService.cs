using System;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using ConversaStudio.Services.Deployments.Dto;

namespace ConversaStudio.Services.Deployments;

/// <summary>
/// Defines application-level widget deployment workflows for published bots.
/// </summary>
public interface IBotDeploymentAppService : IApplicationService
{
    /// <summary>
    /// Returns the current user's deployments.
    /// </summary>
    Task<ListResultDto<BotDeploymentDto>> GetDeployments();

    /// <summary>
    /// Returns a single deployment.
    /// </summary>
    Task<BotDeploymentDto> GetDeployment(EntityDto<Guid> input);

    /// <summary>
    /// Creates a new widget deployment.
    /// </summary>
    Task<BotDeploymentDto> CreateWidgetDeployment(CreateBotDeploymentRequest input);

    /// <summary>
    /// Updates widget deployment settings.
    /// </summary>
    Task<BotDeploymentDto> UpdateWidgetDeployment(UpdateBotDeploymentRequest input);

    /// <summary>
    /// Marks a deployment active.
    /// </summary>
    Task<BotDeploymentDto> Activate(EntityDto<Guid> input);

    /// <summary>
    /// Marks a deployment inactive.
    /// </summary>
    Task<BotDeploymentDto> Deactivate(EntityDto<Guid> input);

    /// <summary>
    /// Returns an embeddable install snippet.
    /// </summary>
    Task<DeploymentSnippetDto> GetInstallSnippet(EntityDto<Guid> input);
}
