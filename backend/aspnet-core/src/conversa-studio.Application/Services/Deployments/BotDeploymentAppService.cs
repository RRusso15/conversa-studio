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
using ConversaStudio.Domains.Bots;
using ConversaStudio.Domains.Deployments;
using ConversaStudio.Domains.Runtime;
using ConversaStudio.Services.Deployments.Dto;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConversaStudio.Services.Deployments;

/// <summary>
/// Orchestrates deployment management for published bots.
/// </summary>
[AbpAuthorize(PermissionNames.Pages_Bots)]
public class BotDeploymentAppService : ConversaStudioAppServiceBase, IBotDeploymentAppService
{
    private static readonly JsonSerializerOptions GraphSerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    private readonly IRepository<BotDeployment, Guid> _botDeploymentRepository;
    private readonly IRepository<BotDefinition, Guid> _botDefinitionRepository;
    private readonly PublishedGraphRuntimeValidator _runtimeValidator;
    private readonly IConfiguration _configuration;

    public BotDeploymentAppService(
        IRepository<BotDeployment, Guid> botDeploymentRepository,
        IRepository<BotDefinition, Guid> botDefinitionRepository,
        PublishedGraphRuntimeValidator runtimeValidator,
        IConfiguration configuration)
    {
        _botDeploymentRepository = botDeploymentRepository;
        _botDefinitionRepository = botDefinitionRepository;
        _runtimeValidator = runtimeValidator;
        _configuration = configuration;
    }

    /// <summary>
    /// Returns the current user's deployments.
    /// </summary>
    [HttpGet]
    public async Task<ListResultDto<BotDeploymentDto>> GetDeployments()
    {
        var currentUser = await GetCurrentUserAsync();
        var deployments = await (
            from deployment in _botDeploymentRepository.GetAll()
            join bot in _botDefinitionRepository.GetAll() on deployment.BotDefinitionId equals bot.Id
            where deployment.TenantId == AbpSession.TenantId && bot.OwnerUserId == currentUser.Id
            orderby deployment.LastModificationTime ?? deployment.CreationTime descending
            select new { deployment, bot.Name }
        ).ToListAsync();

        return new ListResultDto<BotDeploymentDto>(deployments.Select(item => MapToDto(item.deployment, item.Name)).ToList());
    }

    /// <summary>
    /// Returns a single deployment.
    /// </summary>
    [HttpGet]
    public async Task<BotDeploymentDto> GetDeployment(EntityDto<Guid> input)
    {
        var deployment = await GetOwnedDeploymentAsync(input.Id);
        var bot = await GetOwnedBotAsync(deployment.BotDefinitionId);
        return MapToDto(deployment, bot.Name);
    }

    /// <summary>
    /// Creates a new widget deployment.
    /// </summary>
    [HttpPost]
    public async Task<BotDeploymentDto> CreateWidgetDeployment(CreateBotDeploymentRequest input)
    {
        var bot = await GetOwnedBotAsync(input.BotDefinitionId);
        EnsurePublished(bot);

        var deployment = new BotDeployment(
            Guid.NewGuid(),
            AbpSession.TenantId,
            bot.Id,
            ResolveName(input.Name, bot.Name),
            CreateDeploymentKey(),
            SerializeDomains(input.AllowedDomains),
            ResolveLauncherLabel(input.LauncherLabel, bot.Name),
            ResolveThemeColor(input.ThemeColor));

        await _botDeploymentRepository.InsertAsync(deployment);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDto(deployment, bot.Name);
    }

    /// <summary>
    /// Updates widget deployment settings.
    /// </summary>
    [HttpPut]
    public async Task<BotDeploymentDto> UpdateWidgetDeployment(UpdateBotDeploymentRequest input)
    {
        var deployment = await GetOwnedDeploymentAsync(input.Id);
        var bot = await GetOwnedBotAsync(deployment.BotDefinitionId);

        deployment.UpdateSettings(
            ResolveName(input.Name, bot.Name),
            SerializeDomains(input.AllowedDomains),
            ResolveLauncherLabel(input.LauncherLabel, bot.Name),
            ResolveThemeColor(input.ThemeColor));

        await _botDeploymentRepository.UpdateAsync(deployment);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDto(deployment, bot.Name);
    }

    /// <summary>
    /// Marks a deployment active.
    /// </summary>
    [HttpPost]
    public async Task<BotDeploymentDto> Activate(EntityDto<Guid> input)
    {
        var deployment = await GetOwnedDeploymentAsync(input.Id);
        var bot = await GetOwnedBotAsync(deployment.BotDefinitionId);
        EnsureCanActivate(bot, deployment);

        deployment.Activate();
        await _botDeploymentRepository.UpdateAsync(deployment);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDto(deployment, bot.Name);
    }

    /// <summary>
    /// Marks a deployment inactive.
    /// </summary>
    [HttpPost]
    public async Task<BotDeploymentDto> Deactivate(EntityDto<Guid> input)
    {
        var deployment = await GetOwnedDeploymentAsync(input.Id);
        var bot = await GetOwnedBotAsync(deployment.BotDefinitionId);

        deployment.Deactivate();
        await _botDeploymentRepository.UpdateAsync(deployment);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDto(deployment, bot.Name);
    }

    /// <summary>
    /// Returns an embeddable install snippet for the widget deployment.
    /// </summary>
    [HttpGet]
    public async Task<DeploymentSnippetDto> GetInstallSnippet(EntityDto<Guid> input)
    {
        var deployment = await GetOwnedDeploymentAsync(input.Id);
        var clientRootAddress = ResolveClientRootAddress();
        var serverRootAddress = ResolveServerRootAddress();

        return new DeploymentSnippetDto
        {
            DeploymentKey = deployment.DeploymentKey,
            Snippet =
                "<script>\n" +
                "  window.ConversaStudioWidgetConfig = {\n" +
                $"    deploymentKey: \"{deployment.DeploymentKey}\",\n" +
                $"    apiBaseUrl: \"{serverRootAddress.TrimEnd('/')}\",\n" +
                $"    clientBaseUrl: \"{clientRootAddress.TrimEnd('/')}\",\n" +
                $"    launcherLabel: {JsonSerializer.Serialize(deployment.LauncherLabel)},\n" +
                $"    themeColor: {JsonSerializer.Serialize(deployment.ThemeColor)}\n" +
                "  };\n" +
                "</script>\n" +
                $"<script src=\"{clientRootAddress.TrimEnd('/')}/widget/loader\" defer></script>"
        };
    }

    private async Task<BotDefinition> GetOwnedBotAsync(Guid botId)
    {
        var currentUser = await GetCurrentUserAsync();
        var bot = await _botDefinitionRepository.FirstOrDefaultAsync(candidate =>
            candidate.Id == botId &&
            candidate.TenantId == AbpSession.TenantId &&
            candidate.OwnerUserId == currentUser.Id);

        if (bot == null)
        {
            throw new UserFriendlyException("The requested bot could not be found.");
        }

        return bot;
    }

    private async Task<BotDeployment> GetOwnedDeploymentAsync(Guid deploymentId)
    {
        var currentUser = await GetCurrentUserAsync();
        var deployment = await (
            from candidate in _botDeploymentRepository.GetAll()
            join bot in _botDefinitionRepository.GetAll() on candidate.BotDefinitionId equals bot.Id
            where candidate.Id == deploymentId &&
                  candidate.TenantId == AbpSession.TenantId &&
                  bot.OwnerUserId == currentUser.Id
            select candidate
        ).FirstOrDefaultAsync();

        if (deployment == null)
        {
            throw new UserFriendlyException("The requested deployment could not be found.");
        }

        return deployment;
    }

    private static void EnsurePublished(BotDefinition bot)
    {
        if (!bot.PublishedVersion.HasValue || string.IsNullOrWhiteSpace(bot.PublishedGraphJson))
        {
            throw new UserFriendlyException("Publish this bot before creating or activating a deployment.");
        }
    }

    private void EnsureCanActivate(BotDefinition bot, BotDeployment deployment)
    {
        EnsurePublished(bot);

        var allowedDomains = DeserializeDomains(deployment.AllowedDomainsJson);
        if (allowedDomains.Count == 0)
        {
            throw new UserFriendlyException("Add at least one allowed domain before activating this deployment.");
        }

        var graph = JsonSerializer.Deserialize<BotGraphDefinition>(bot.PublishedGraphJson, GraphSerializerOptions) ?? new BotGraphDefinition();
        var blockingIssues = _runtimeValidator.ValidateForLiveRuntime(graph)
            .Where(issue => string.Equals(issue.Severity, BotValidationSeverity.Error, StringComparison.OrdinalIgnoreCase))
            .Select(issue => issue.Message)
            .Distinct()
            .ToList();

        if (blockingIssues.Count > 0)
        {
            throw new UserFriendlyException(string.Join(" ", blockingIssues));
        }
    }

    private static string SerializeDomains(IEnumerable<string> allowedDomains)
    {
        var normalized = allowedDomains
            .Select(domain => domain?.Trim())
            .Where(domain => !string.IsNullOrWhiteSpace(domain))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return JsonSerializer.Serialize(normalized);
    }

    private static List<string> DeserializeDomains(string allowedDomainsJson)
    {
        return JsonSerializer.Deserialize<List<string>>(allowedDomainsJson) ?? [];
    }

    private static string CreateDeploymentKey()
    {
        return Guid.NewGuid().ToString("N");
    }

    private static string ResolveName(string requestedName, string botName)
    {
        var resolved = string.IsNullOrWhiteSpace(requestedName)
            ? $"{botName} Widget"
            : requestedName.Trim();
        return resolved;
    }

    private static string ResolveLauncherLabel(string requestedLabel, string botName)
    {
        return string.IsNullOrWhiteSpace(requestedLabel)
            ? $"Chat with {botName}"
            : requestedLabel.Trim();
    }

    private static string ResolveThemeColor(string requestedThemeColor)
    {
        return string.IsNullOrWhiteSpace(requestedThemeColor) ? "#2563EB" : requestedThemeColor.Trim();
    }

    private string ResolveServerRootAddress()
    {
        return _configuration["App:ServerRootAddress"]?.TrimEnd('/') ?? string.Empty;
    }

    private string ResolveClientRootAddress()
    {
        var configuredClientRoot = _configuration["App:ClientRootAddress"]?.Trim();
        if (!string.IsNullOrWhiteSpace(configuredClientRoot))
        {
            return configuredClientRoot;
        }

        var serverRootAddress = ResolveServerRootAddress().TrimEnd('/');
        var corsOrigins = (_configuration["App:CorsOrigins"] ?? string.Empty)
            .Split(",", StringSplitOptions.RemoveEmptyEntries)
            .Select(origin => origin.Trim())
            .FirstOrDefault(origin => !string.Equals(origin.TrimEnd('/'), serverRootAddress, StringComparison.OrdinalIgnoreCase));

        return corsOrigins ?? serverRootAddress;
    }

    private static BotDeploymentDto MapToDto(BotDeployment deployment, string botName)
    {
        return new BotDeploymentDto
        {
            Id = deployment.Id,
            BotDefinitionId = deployment.BotDefinitionId,
            BotName = botName,
            Name = deployment.Name,
            ChannelType = deployment.ChannelType,
            Status = deployment.Status,
            DeploymentKey = deployment.DeploymentKey,
            AllowedDomains = DeserializeDomains(deployment.AllowedDomainsJson),
            LauncherLabel = deployment.LauncherLabel,
            ThemeColor = deployment.ThemeColor,
            UpdatedAt = deployment.LastModificationTime ?? deployment.CreationTime
        };
    }
}
