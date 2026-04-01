using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using ConversaStudio.Authorization;
using ConversaStudio.Domains.Bots;
using ConversaStudio.Domains.Deployments;
using ConversaStudio.Domains.Runtime;
using ConversaStudio.Domains.Transcripts;
using ConversaStudio.Services.Transcripts.Dto;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConversaStudio.Services.Transcripts;

/// <summary>
/// Exposes developer-facing transcript session queries for owned bots.
/// </summary>
[AbpAuthorize(PermissionNames.Pages_Bots)]
public class TranscriptAppService : ConversaStudioAppServiceBase, ITranscriptAppService
{
    private readonly IRepository<BotDefinition, Guid> _botDefinitionRepository;
    private readonly IRepository<BotDeployment, Guid> _botDeploymentRepository;
    private readonly IRepository<RuntimeSession, Guid> _runtimeSessionRepository;
    private readonly IRepository<TranscriptMessage, Guid> _transcriptMessageRepository;

    public TranscriptAppService(
        IRepository<BotDefinition, Guid> botDefinitionRepository,
        IRepository<BotDeployment, Guid> botDeploymentRepository,
        IRepository<RuntimeSession, Guid> runtimeSessionRepository,
        IRepository<TranscriptMessage, Guid> transcriptMessageRepository)
    {
        _botDefinitionRepository = botDefinitionRepository;
        _botDeploymentRepository = botDeploymentRepository;
        _runtimeSessionRepository = runtimeSessionRepository;
        _transcriptMessageRepository = transcriptMessageRepository;
    }

    /// <summary>
    /// Returns paged transcript session summaries for the current developer.
    /// </summary>
    [HttpGet]
    public async Task<PagedResultDto<TranscriptSessionSummaryDto>> GetTranscripts(GetTranscriptsRequest input)
    {
        var currentUser = await GetCurrentUserAsync();
        var normalizedSearch = input.SearchText?.Trim();
        var status = input.Status?.Trim().ToLowerInvariant() ?? string.Empty;

        var baseQuery =
            from session in _runtimeSessionRepository.GetAll()
            join bot in _botDefinitionRepository.GetAll() on session.BotDefinitionId equals bot.Id
            join deployment in _botDeploymentRepository.GetAll() on session.BotDeploymentId equals deployment.Id
            where session.TenantId == AbpSession.TenantId &&
                  bot.OwnerUserId == currentUser.Id
            select new
            {
                Session = session,
                Bot = bot,
                Deployment = deployment
            };

        if (input.BotId.HasValue)
        {
            baseQuery = baseQuery.Where(item => item.Session.BotDefinitionId == input.BotId.Value);
        }

        if (status == "completed")
        {
            baseQuery = baseQuery.Where(item => item.Session.IsCompleted);
        }
        else if (status == "awaiting_input")
        {
            baseQuery = baseQuery.Where(item => item.Session.AwaitingInput && !item.Session.IsCompleted);
        }

        if (!string.IsNullOrWhiteSpace(normalizedSearch))
        {
            var searchPattern = $"%{normalizedSearch.ToLowerInvariant()}%";
            baseQuery = baseQuery.Where(item =>
                EF.Functions.Like(item.Session.SessionToken.ToLower(), searchPattern) ||
                EF.Functions.Like(item.Bot.Name.ToLower(), searchPattern) ||
                EF.Functions.Like(item.Deployment.Name.ToLower(), searchPattern) ||
                _transcriptMessageRepository.GetAll().Any(message =>
                    message.RuntimeSessionId == item.Session.Id &&
                    EF.Functions.Like(message.Content.ToLower(), searchPattern)));
        }

        var totalCount = await baseQuery.CountAsync();
        var pageSize = input.MaxResultCount <= 0 ? 20 : Math.Min(input.MaxResultCount, 50);
        var skipCount = Math.Max(input.SkipCount, 0);

        var page = await baseQuery
            .OrderByDescending(item => item.Session.LastModificationTime ?? item.Session.CreationTime)
            .Skip(skipCount)
            .Take(pageSize)
            .Select(item => new TranscriptSessionSummaryDto
            {
                Id = item.Session.Id,
                BotId = item.Bot.Id,
                BotName = item.Bot.Name,
                DeploymentId = item.Deployment.Id,
                DeploymentName = item.Deployment.Name,
                SessionToken = item.Session.SessionToken,
                CreatedAt = item.Session.CreationTime,
                UpdatedAt = item.Session.LastModificationTime ?? item.Session.CreationTime,
                AwaitingInput = item.Session.AwaitingInput,
                IsCompleted = item.Session.IsCompleted,
                PublishedVersion = item.Session.PublishedVersion
            })
            .ToListAsync();

        await EnrichTranscriptSummariesAsync(page);

        return new PagedResultDto<TranscriptSessionSummaryDto>(totalCount, page);
    }

    /// <summary>
    /// Returns one transcript session with its ordered messages.
    /// </summary>
    [HttpGet]
    public async Task<TranscriptDetailDto> GetTranscript(EntityDto<Guid> input)
    {
        var currentUser = await GetCurrentUserAsync();
        var transcript = await (
            from session in _runtimeSessionRepository.GetAll()
            join bot in _botDefinitionRepository.GetAll() on session.BotDefinitionId equals bot.Id
            join deployment in _botDeploymentRepository.GetAll() on session.BotDeploymentId equals deployment.Id
            where session.Id == input.Id &&
                  session.TenantId == AbpSession.TenantId &&
                  bot.OwnerUserId == currentUser.Id
            select new TranscriptDetailDto
            {
                Id = session.Id,
                BotId = bot.Id,
                BotName = bot.Name,
                DeploymentId = deployment.Id,
                DeploymentName = deployment.Name,
                SessionToken = session.SessionToken,
                CreatedAt = session.CreationTime,
                UpdatedAt = session.LastModificationTime ?? session.CreationTime,
                AwaitingInput = session.AwaitingInput,
                IsCompleted = session.IsCompleted,
                PublishedVersion = session.PublishedVersion
            }
        ).FirstOrDefaultAsync();

        if (transcript == null)
        {
            throw new UserFriendlyException("The requested transcript could not be found.");
        }

        var messages = await _transcriptMessageRepository.GetAll()
            .Where(message => message.RuntimeSessionId == transcript.Id)
            .OrderBy(message => message.CreationTime)
            .Select(message => new TranscriptMessageDto
            {
                Id = message.Id,
                Role = message.Role,
                Content = message.Content,
                CreatedAt = message.CreationTime
            })
            .ToListAsync();

        transcript.Messages = messages;
        transcript.MessageCount = messages.Count;
        transcript.LastMessagePreview = BuildLastMessagePreview(messages.LastOrDefault()?.Content);

        return transcript;
    }

    /// <summary>
    /// Enriches transcript summaries with message counts and latest previews.
    /// </summary>
    private async Task EnrichTranscriptSummariesAsync(List<TranscriptSessionSummaryDto> summaries)
    {
        if (summaries.Count == 0)
        {
            return;
        }

        var sessionIds = summaries.Select(summary => summary.Id).ToList();
        var messages = await _transcriptMessageRepository.GetAll()
            .Where(message => sessionIds.Contains(message.RuntimeSessionId))
            .OrderBy(message => message.CreationTime)
            .Select(message => new
            {
                message.RuntimeSessionId,
                message.Content
            })
            .ToListAsync();

        var messageGroups = messages
            .GroupBy(message => message.RuntimeSessionId)
            .ToDictionary(group => group.Key, group => group.ToList());

        foreach (var summary in summaries)
        {
            if (!messageGroups.TryGetValue(summary.Id, out var sessionMessages))
            {
                summary.MessageCount = 0;
                summary.LastMessagePreview = string.Empty;
                continue;
            }

            summary.MessageCount = sessionMessages.Count;
            summary.LastMessagePreview = BuildLastMessagePreview(sessionMessages.LastOrDefault()?.Content);
        }
    }

    /// <summary>
    /// Normalizes a message preview for compact transcript list presentation.
    /// </summary>
    private static string BuildLastMessagePreview(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return string.Empty;
        }

        var normalized = string.Join(" ", content
            .Split(["\r\n", "\n", "\r"], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));

        return normalized.Length <= 180 ? normalized : $"{normalized[..177]}...";
    }
}
