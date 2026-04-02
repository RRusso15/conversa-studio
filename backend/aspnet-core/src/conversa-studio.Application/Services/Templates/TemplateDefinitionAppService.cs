using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using ConversaStudio.Authorization;
using ConversaStudio.Authorization.Roles;
using ConversaStudio.Authorization.Users;
using ConversaStudio.Domains.Bots;
using ConversaStudio.Domains.Templates;
using ConversaStudio.Services.Bots;
using ConversaStudio.Services.Bots.Dto;
using ConversaStudio.Services.Templates.Dto;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConversaStudio.Services.Templates;

/// <summary>
/// Manages reusable template drafts, publishing, and developer library access.
/// </summary>
[AbpAuthorize(PermissionNames.Pages_Bots)]
public class TemplateDefinitionAppService : ConversaStudioAppServiceBase, ITemplateDefinitionAppService
{
    private readonly IRepository<TemplateDefinition, Guid> _templateDefinitionRepository;
    private readonly BotGraphValidator _botGraphValidator;
    private readonly UserManager _userManager;

    public TemplateDefinitionAppService(
        IRepository<TemplateDefinition, Guid> templateDefinitionRepository,
        BotGraphValidator botGraphValidator,
        UserManager userManager)
    {
        _templateDefinitionRepository = templateDefinitionRepository;
        _botGraphValidator = botGraphValidator;
        _userManager = userManager;
    }

    /// <summary>
    /// Returns published templates visible to developers in the current tenant.
    /// </summary>
    [HttpGet]
    public async Task<ListResultDto<TemplateSummaryDto>> GetPublishedTemplates()
    {
        await GetCurrentUserAsync();
        var templates = await _templateDefinitionRepository.GetAll()
            .Where(template => template.TenantId == AbpSession.TenantId && template.PublishedVersion.HasValue)
            .OrderBy(template => template.Category)
            .ThenBy(template => template.Name)
            .ToListAsync();

        return new ListResultDto<TemplateSummaryDto>(templates.Select(MapToSummaryDto).ToList());
    }

    /// <summary>
    /// Returns all template drafts and published templates for admin management.
    /// </summary>
    [HttpGet]
    public async Task<ListResultDto<TemplateSummaryDto>> GetAdminTemplates()
    {
        await EnsureCurrentUserIsAdminAsync();
        var templates = await _templateDefinitionRepository.GetAll()
            .Where(template => template.TenantId == AbpSession.TenantId)
            .OrderByDescending(template => template.LastModificationTime ?? template.CreationTime)
            .ToListAsync();

        return new ListResultDto<TemplateSummaryDto>(templates.Select(MapToSummaryDto).ToList());
    }

    /// <summary>
    /// Returns a published template definition for developer preview and use.
    /// </summary>
    [HttpGet]
    public async Task<TemplateDefinitionDto> GetPublishedTemplate(EntityDto<Guid> input)
    {
        await GetCurrentUserAsync();
        var template = await GetPublishedTemplateAsync(input.Id);
        return MapToDefinitionDto(template, usePublishedSnapshot: true);
    }

    /// <summary>
    /// Returns a template draft definition for admin editing.
    /// </summary>
    [HttpGet]
    public async Task<TemplateDefinitionDto> GetTemplate(EntityDto<Guid> input)
    {
        var template = await GetAdminTemplateAsync(input.Id);
        return MapToDefinitionDto(template, usePublishedSnapshot: false);
    }

    /// <summary>
    /// Creates a new template draft.
    /// </summary>
    [HttpPost]
    public async Task<TemplateDefinitionDto> CreateDraft(CreateTemplateDefinitionRequest input)
    {
        var currentUser = await EnsureCurrentUserIsAdminAsync();
        var graph = BotGraphMapper.MapToDomainGraph(input.Graph);
        ThrowIfInvalid(graph);

        var template = new TemplateDefinition(
            Guid.NewGuid(),
            AbpSession.TenantId,
            currentUser.Id,
            ResolveName(input.Name, graph.Metadata.Name),
            ResolveDescription(input.Description),
            ResolveCategory(input.Category),
            BotGraphMapper.Serialize(graph));

        await _templateDefinitionRepository.InsertAsync(template);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDefinitionDto(template, usePublishedSnapshot: false, graph);
    }

    /// <summary>
    /// Updates an existing template draft.
    /// </summary>
    [HttpPut]
    public async Task<TemplateDefinitionDto> UpdateDraft(UpdateTemplateDefinitionRequest input)
    {
        var template = await GetAdminTemplateAsync(input.Id);
        var graph = BotGraphMapper.MapToDomainGraph(input.Graph);
        ThrowIfInvalid(graph);

        template.UpdateDraft(
            ResolveName(input.Name, graph.Metadata.Name),
            ResolveDescription(input.Description),
            ResolveCategory(input.Category),
            BotGraphMapper.Serialize(graph));

        await _templateDefinitionRepository.UpdateAsync(template);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDefinitionDto(template, usePublishedSnapshot: false, graph);
    }

    /// <summary>
    /// Publishes the current template draft to the developer library.
    /// </summary>
    [HttpPost]
    public async Task<TemplateDefinitionDto> PublishDraft(EntityDto<Guid> input)
    {
        var template = await GetAdminTemplateAsync(input.Id);
        var graph = BotGraphMapper.Deserialize(template.DraftGraphJson);
        ThrowIfInvalid(graph);

        template.PublishDraft();
        await _templateDefinitionRepository.UpdateAsync(template);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDefinitionDto(template, usePublishedSnapshot: false, graph);
    }

    /// <summary>
    /// Removes the current published snapshot while preserving the draft.
    /// </summary>
    [HttpPost]
    public async Task<TemplateDefinitionDto> Unpublish(EntityDto<Guid> input)
    {
        var template = await GetAdminTemplateAsync(input.Id);
        var graph = BotGraphMapper.Deserialize(template.DraftGraphJson);

        template.Unpublish();
        await _templateDefinitionRepository.UpdateAsync(template);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDefinitionDto(template, usePublishedSnapshot: false, graph);
    }

    /// <summary>
    /// Creates a new draft by duplicating an existing template draft.
    /// </summary>
    [HttpPost]
    public async Task<TemplateDefinitionDto> DuplicateTemplate(EntityDto<Guid> input)
    {
        var currentUser = await EnsureCurrentUserIsAdminAsync();
        var sourceTemplate = await GetAdminTemplateAsync(input.Id);
        var graph = BotGraphMapper.Deserialize(sourceTemplate.DraftGraphJson);

        graph.Metadata.Id = Guid.NewGuid().ToString();
        graph.Metadata.Name = $"{sourceTemplate.Name} Copy";
        graph.Metadata.Status = "draft";
        graph.Metadata.Version = "v1";

        var duplicate = new TemplateDefinition(
            Guid.NewGuid(),
            AbpSession.TenantId,
            currentUser.Id,
            $"{sourceTemplate.Name} Copy",
            sourceTemplate.Description,
            sourceTemplate.Category,
            BotGraphMapper.Serialize(graph));

        await _templateDefinitionRepository.InsertAsync(duplicate);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDefinitionDto(duplicate, usePublishedSnapshot: false, graph);
    }

    /// <summary>
    /// Deletes a template draft and any published snapshot.
    /// </summary>
    [HttpPost]
    public async Task DeleteTemplate(EntityDto<Guid> input)
    {
        var template = await GetAdminTemplateAsync(input.Id);
        await _templateDefinitionRepository.DeleteAsync(template);
        await CurrentUnitOfWork.SaveChangesAsync();
    }

    /// <summary>
    /// Validates a template graph without persisting it.
    /// </summary>
    [HttpPost]
    public async Task<ListResultDto<BotValidationResultDto>> ValidateDraft(ValidateTemplateDefinitionRequest input)
    {
        await EnsureCurrentUserIsAdminAsync();
        var graph = BotGraphMapper.MapToDomainGraph(input.Graph);
        var results = _botGraphValidator.Validate(graph)
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

    private async Task<User> EnsureCurrentUserIsAdminAsync()
    {
        var currentUser = await GetCurrentUserAsync();
        var roles = await _userManager.GetRolesAsync(currentUser);

        if (!roles.Contains(StaticRoleNames.Tenants.Admin))
        {
            throw new UserFriendlyException("Only administrators may manage templates.");
        }

        return currentUser;
    }

    private async Task<TemplateDefinition> GetAdminTemplateAsync(Guid templateId)
    {
        await EnsureCurrentUserIsAdminAsync();
        var template = await _templateDefinitionRepository.FirstOrDefaultAsync(candidate =>
            candidate.Id == templateId &&
            candidate.TenantId == AbpSession.TenantId);

        if (template == null)
        {
            throw new UserFriendlyException("The requested template could not be found.");
        }

        return template;
    }

    private async Task<TemplateDefinition> GetPublishedTemplateAsync(Guid templateId)
    {
        var template = await _templateDefinitionRepository.FirstOrDefaultAsync(candidate =>
            candidate.Id == templateId &&
            candidate.TenantId == AbpSession.TenantId &&
            candidate.PublishedVersion.HasValue);

        if (template == null)
        {
            throw new UserFriendlyException("The requested template could not be found.");
        }

        return template;
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

    private static string ResolveName(string requestName, string graphName)
    {
        var resolvedName = !string.IsNullOrWhiteSpace(requestName) ? requestName.Trim() : graphName.Trim();
        return string.IsNullOrWhiteSpace(resolvedName) ? "Untitled Template" : resolvedName;
    }

    private static string ResolveDescription(string description)
    {
        return string.IsNullOrWhiteSpace(description) ? "Reusable starter flow." : description.Trim();
    }

    private static string ResolveCategory(string category)
    {
        return string.IsNullOrWhiteSpace(category) ? "General" : category.Trim();
    }

    private static TemplateSummaryDto MapToSummaryDto(TemplateDefinition template)
    {
        return new TemplateSummaryDto
        {
            Id = template.Id,
            Name = template.Name,
            Description = template.Description,
            Category = template.Category,
            Status = template.Status,
            DraftVersion = template.DraftVersion,
            PublishedVersion = template.PublishedVersion,
            HasUnpublishedChanges = !template.PublishedVersion.HasValue || template.PublishedVersion.Value != template.DraftVersion,
            UpdatedAt = template.LastModificationTime ?? template.CreationTime
        };
    }

    private static TemplateDefinitionDto MapToDefinitionDto(
        TemplateDefinition template,
        bool usePublishedSnapshot,
        BotGraphDefinition? graph = null)
    {
        var snapshotJson = usePublishedSnapshot && !string.IsNullOrWhiteSpace(template.PublishedGraphJson)
            ? template.PublishedGraphJson
            : template.DraftGraphJson;
        var resolvedGraph = graph ?? BotGraphMapper.Deserialize(snapshotJson);
        var version = usePublishedSnapshot ? template.PublishedVersion ?? template.DraftVersion : template.DraftVersion;
        var status = usePublishedSnapshot && template.PublishedVersion.HasValue
            ? TemplateStatus.Published
            : template.Status;

        resolvedGraph.Metadata.Id = template.Id.ToString();
        resolvedGraph.Metadata.Name = template.Name;
        resolvedGraph.Metadata.Status = status.ToLowerInvariant();
        resolvedGraph.Metadata.Version = $"v{version}";

        return new TemplateDefinitionDto
        {
            Id = template.Id,
            Name = template.Name,
            Description = template.Description,
            Category = template.Category,
            Status = template.Status,
            DraftVersion = template.DraftVersion,
            PublishedVersion = template.PublishedVersion,
            HasUnpublishedChanges = !template.PublishedVersion.HasValue || template.PublishedVersion.Value != template.DraftVersion,
            UpdatedAt = template.LastModificationTime ?? template.CreationTime,
            Graph = BotGraphMapper.MapToDto(resolvedGraph)
        };
    }
}
