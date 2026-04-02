using System;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using ConversaStudio.Services.Bots.Dto;
using ConversaStudio.Services.Templates.Dto;

namespace ConversaStudio.Services.Templates;

/// <summary>
/// Exposes reusable template management and library workflows.
/// </summary>
public interface ITemplateDefinitionAppService : IApplicationService
{
    Task<ListResultDto<TemplateSummaryDto>> GetPublishedTemplates();

    Task<ListResultDto<TemplateSummaryDto>> GetAdminTemplates();

    Task<TemplateDefinitionDto> GetPublishedTemplate(EntityDto<Guid> input);

    Task<TemplateDefinitionDto> GetTemplate(EntityDto<Guid> input);

    Task<TemplateDefinitionDto> CreateDraft(CreateTemplateDefinitionRequest input);

    Task<TemplateDefinitionDto> UpdateDraft(UpdateTemplateDefinitionRequest input);

    Task<TemplateDefinitionDto> PublishDraft(EntityDto<Guid> input);

    Task<TemplateDefinitionDto> Unpublish(EntityDto<Guid> input);

    Task<TemplateDefinitionDto> DuplicateTemplate(EntityDto<Guid> input);

    Task DeleteTemplate(EntityDto<Guid> input);

    Task<ListResultDto<BotValidationResultDto>> ValidateDraft(ValidateTemplateDefinitionRequest input);
}
