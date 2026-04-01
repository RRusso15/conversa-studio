using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Abp.Authorization;
using Abp.Domain.Repositories;
using ConversaStudio.Authorization;
using ConversaStudio.Domains.Bots;
using ConversaStudio.Domains.Deployments;
using ConversaStudio.Domains.Runtime;
using ConversaStudio.Domains.Transcripts;
using ConversaStudio.Services.Analytics.Dto;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConversaStudio.Services.Analytics;

/// <summary>
/// Exposes developer-facing analytics queries for owned bots.
/// </summary>
[AbpAuthorize(PermissionNames.Pages_Bots)]
public class AnalyticsAppService : ConversaStudioAppServiceBase, IAnalyticsAppService
{
    private const int BreakdownLimit = 5;

    private readonly IRepository<BotDefinition, Guid> _botDefinitionRepository;
    private readonly IRepository<BotDeployment, Guid> _botDeploymentRepository;
    private readonly IRepository<RuntimeSession, Guid> _runtimeSessionRepository;
    private readonly IRepository<TranscriptMessage, Guid> _transcriptMessageRepository;

    public AnalyticsAppService(
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
    /// Returns KPI analytics for the current developer and date range.
    /// </summary>
    [HttpGet]
    public async Task<AnalyticsOverviewDto> GetAnalyticsOverview(GetAnalyticsRequest input)
    {
        var currentUser = await GetCurrentUserAsync();
        var sessions = await BuildBaseQuery(currentUser.Id, input)
            .Select(item => new AnalyticsSessionMetricRow
            {
                SessionId = item.SessionId,
                CreatedAt = item.CreatedAt,
                UpdatedAt = item.UpdatedAt,
                AwaitingInput = item.AwaitingInput,
                IsCompleted = item.IsCompleted
            })
            .ToListAsync();

        if (sessions.Count == 0)
        {
            return new AnalyticsOverviewDto();
        }

        var messageCounts = await GetMessageCountsBySessionAsync(sessions.Select(item => item.SessionId).ToList());
        var completedCount = sessions.Count(item => item.IsCompleted);
        var awaitingInputCount = sessions.Count(item => item.AwaitingInput && !item.IsCompleted);
        var totalMessages = messageCounts.Values.Sum();
        var averageDurationSeconds = sessions.Average(item => Math.Max(0, (item.UpdatedAt - item.CreatedAt).TotalSeconds));

        return new AnalyticsOverviewDto
        {
            TotalConversations = sessions.Count,
            CompletionRate = CalculatePercentage(completedCount, sessions.Count),
            AwaitingInputRate = CalculatePercentage(awaitingInputCount, sessions.Count),
            AverageMessagesPerConversation = Math.Round((double)totalMessages / sessions.Count, 1),
            AverageConversationDurationSeconds = Math.Round(averageDurationSeconds, 1),
            TotalMessages = totalMessages,
            LatestConversationAt = sessions.Max(item => item.UpdatedAt)
        };
    }

    /// <summary>
    /// Returns daily conversation trend data for the current developer and date range.
    /// </summary>
    [HttpGet]
    public async Task<AnalyticsTimeseriesDto> GetAnalyticsTimeseries(GetAnalyticsRequest input)
    {
        var currentUser = await GetCurrentUserAsync();
        var points = await BuildBaseQuery(currentUser.Id, input)
            .GroupBy(item => item.CreatedAt.Date)
            .Select(group => new AnalyticsTimeseriesPointDto
            {
                Date = group.Key,
                Label = group.Key.ToString("MMM d", CultureInfo.InvariantCulture),
                ConversationCount = group.Count()
            })
            .OrderBy(point => point.Date)
            .ToListAsync();

        return new AnalyticsTimeseriesDto
        {
            Points = points
        };
    }

    /// <summary>
    /// Returns grouped analytics breakdowns for the current developer and date range.
    /// </summary>
    [HttpGet]
    public async Task<AnalyticsBreakdownDto> GetAnalyticsBreakdown(GetAnalyticsRequest input)
    {
        var currentUser = await GetCurrentUserAsync();
        var sessions = await BuildBaseQuery(currentUser.Id, input)
            .Select(item => new AnalyticsBreakdownSessionRow
            {
                SessionId = item.SessionId,
                BotId = item.BotId,
                BotName = item.BotName,
                DeploymentId = item.DeploymentId,
                DeploymentName = item.DeploymentName,
                AwaitingInput = item.AwaitingInput,
                IsCompleted = item.IsCompleted
            })
            .ToListAsync();

        if (sessions.Count == 0)
        {
            return new AnalyticsBreakdownDto();
        }

        var messageCounts = await GetMessageCountsBySessionAsync(sessions.Select(item => item.SessionId).ToList());
        var completedCount = sessions.Count(item => item.IsCompleted);
        var awaitingInputCount = sessions.Count(item => item.AwaitingInput && !item.IsCompleted);
        var activeCount = sessions.Count(item => !item.IsCompleted && !item.AwaitingInput);

        return new AnalyticsBreakdownDto
        {
            TopBots = BuildBreakdownItems(
                sessions,
                session => session.BotId,
                session => session.BotName,
                messageCounts),
            TopDeployments = BuildBreakdownItems(
                sessions,
                session => session.DeploymentId,
                session => session.DeploymentName,
                messageCounts),
            CompletedCount = completedCount,
            AwaitingInputCount = awaitingInputCount,
            ActiveCount = activeCount
        };
    }

    /// <summary>
    /// Builds the developer-owned runtime session query with optional filters.
    /// </summary>
    private IQueryable<AnalyticsSessionQueryRow> BuildBaseQuery(long currentUserId, GetAnalyticsRequest input)
    {
        var rangeStart = ResolveRangeStart(input.DateRange);

        var query =
            from session in _runtimeSessionRepository.GetAll()
            join bot in _botDefinitionRepository.GetAll() on session.BotDefinitionId equals bot.Id
            join deployment in _botDeploymentRepository.GetAll() on session.BotDeploymentId equals deployment.Id
            where session.TenantId == AbpSession.TenantId &&
                  bot.OwnerUserId == currentUserId
            select new AnalyticsSessionQueryRow
            {
                SessionId = session.Id,
                BotId = bot.Id,
                BotName = bot.Name,
                DeploymentId = deployment.Id,
                DeploymentName = deployment.Name,
                CreatedAt = session.CreationTime,
                UpdatedAt = session.LastModificationTime ?? session.CreationTime,
                AwaitingInput = session.AwaitingInput,
                IsCompleted = session.IsCompleted
            };

        if (input.BotId.HasValue)
        {
            query = query.Where(item => item.BotId == input.BotId.Value);
        }

        if (rangeStart.HasValue)
        {
            query = query.Where(item => item.CreatedAt >= rangeStart.Value);
        }

        return query;
    }

    /// <summary>
    /// Returns transcript message counts grouped by runtime session identifier.
    /// </summary>
    private async Task<Dictionary<Guid, int>> GetMessageCountsBySessionAsync(List<Guid> sessionIds)
    {
        if (sessionIds.Count == 0)
        {
            return [];
        }

        var groupedCounts = await _transcriptMessageRepository.GetAll()
            .Where(message => sessionIds.Contains(message.RuntimeSessionId))
            .GroupBy(message => message.RuntimeSessionId)
            .Select(group => new
            {
                SessionId = group.Key,
                Count = group.Count()
            })
            .ToListAsync();

        return groupedCounts.ToDictionary(item => item.SessionId, item => item.Count);
    }

    /// <summary>
    /// Builds grouped breakdown rows for bots or deployments.
    /// </summary>
    private static List<AnalyticsBreakdownItemDto> BuildBreakdownItems<TGroupKey>(
        IEnumerable<AnalyticsBreakdownSessionRow> sessions,
        Func<AnalyticsBreakdownSessionRow, TGroupKey> keySelector,
        Func<AnalyticsBreakdownSessionRow, string> nameSelector,
        IReadOnlyDictionary<Guid, int> messageCounts)
        where TGroupKey : notnull
    {
        return sessions
            .GroupBy(keySelector)
            .Select(group =>
            {
                var first = group.First();
                var totalMessageCount = group.Sum(session =>
                    messageCounts.TryGetValue(session.SessionId, out var count) ? count : 0);
                var completedConversationCount = group.Count(session => session.IsCompleted);
                var awaitingInputConversationCount = group.Count(session => session.AwaitingInput && !session.IsCompleted);

                return new AnalyticsBreakdownItemDto
                {
                    Id = ResolveGuid(first, keySelector),
                    Name = nameSelector(first),
                    ConversationCount = group.Count(),
                    CompletedConversationCount = completedConversationCount,
                    AwaitingInputConversationCount = awaitingInputConversationCount,
                    ActiveConversationCount = group.Count() - completedConversationCount - awaitingInputConversationCount,
                    TotalMessageCount = totalMessageCount
                };
            })
            .OrderByDescending(item => item.ConversationCount)
            .ThenBy(item => item.Name)
            .Take(BreakdownLimit)
            .ToList();
    }

    /// <summary>
    /// Resolves a grouped item identifier from the underlying session row.
    /// </summary>
    private static Guid ResolveGuid<TGroupKey>(
        AnalyticsBreakdownSessionRow session,
        Func<AnalyticsBreakdownSessionRow, TGroupKey> keySelector)
        where TGroupKey : notnull
    {
        var key = keySelector(session);

        return key switch
        {
            Guid guid => guid,
            _ => Guid.Empty
        };
    }

    /// <summary>
    /// Converts a date range token into a UTC start date.
    /// </summary>
    private static DateTime? ResolveRangeStart(string dateRange)
    {
        var normalizedDateRange = dateRange.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;

        return normalizedDateRange switch
        {
            "7d" => now.AddDays(-7),
            "30d" or "" => now.AddDays(-30),
            "90d" => now.AddDays(-90),
            "all" => null,
            _ => now.AddDays(-30)
        };
    }

    /// <summary>
    /// Calculates a one-decimal percentage from a numerator and denominator.
    /// </summary>
    private static double CalculatePercentage(int numerator, int denominator)
    {
        if (denominator <= 0)
        {
            return 0;
        }

        return Math.Round((double)numerator / denominator * 100, 1);
    }

    /// <summary>
    /// Represents the shared analytics runtime session query projection.
    /// </summary>
    private sealed class AnalyticsSessionQueryRow
    {
        public Guid SessionId { get; set; }

        public Guid BotId { get; set; }

        public string BotName { get; set; } = string.Empty;

        public Guid DeploymentId { get; set; }

        public string DeploymentName { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public bool AwaitingInput { get; set; }

        public bool IsCompleted { get; set; }
    }

    /// <summary>
    /// Represents the session fields required for overview calculations.
    /// </summary>
    private sealed class AnalyticsSessionMetricRow
    {
        public Guid SessionId { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public bool AwaitingInput { get; set; }

        public bool IsCompleted { get; set; }
    }

    /// <summary>
    /// Represents the session fields required for grouped analytics breakdowns.
    /// </summary>
    private sealed class AnalyticsBreakdownSessionRow
    {
        public Guid SessionId { get; set; }

        public Guid BotId { get; set; }

        public string BotName { get; set; } = string.Empty;

        public Guid DeploymentId { get; set; }

        public string DeploymentName { get; set; } = string.Empty;

        public bool AwaitingInput { get; set; }

        public bool IsCompleted { get; set; }
    }
}
