using System;
using System.Collections.Generic;

namespace ConversaStudio.Services.Analytics.Dto;

/// <summary>
/// Defines the filters applied to developer analytics queries.
/// </summary>
public class GetAnalyticsRequest
{
    /// <summary>
    /// Gets or sets the optional bot identifier filter.
    /// </summary>
    public Guid? BotId { get; set; }

    /// <summary>
    /// Gets or sets the selected date range token.
    /// </summary>
    public string DateRange { get; set; } = "30d";
}

/// <summary>
/// Represents high-level analytics metrics for the current developer.
/// </summary>
public class AnalyticsOverviewDto
{
    /// <summary>
    /// Gets or sets the total number of conversations.
    /// </summary>
    public int TotalConversations { get; set; }

    /// <summary>
    /// Gets or sets the completion rate as a percentage.
    /// </summary>
    public double CompletionRate { get; set; }

    /// <summary>
    /// Gets or sets the awaiting-input rate as a percentage.
    /// </summary>
    public double AwaitingInputRate { get; set; }

    /// <summary>
    /// Gets or sets the average number of messages per conversation.
    /// </summary>
    public double AverageMessagesPerConversation { get; set; }

    /// <summary>
    /// Gets or sets the average conversation duration in seconds.
    /// </summary>
    public double AverageConversationDurationSeconds { get; set; }

    /// <summary>
    /// Gets or sets the total number of transcript messages.
    /// </summary>
    public int TotalMessages { get; set; }

    /// <summary>
    /// Gets or sets when the most recent conversation activity occurred.
    /// </summary>
    public DateTime? LatestConversationAt { get; set; }
}

/// <summary>
/// Represents one daily analytics trend point.
/// </summary>
public class AnalyticsTimeseriesPointDto
{
    /// <summary>
    /// Gets or sets the UTC date for the bucket.
    /// </summary>
    public DateTime Date { get; set; }

    /// <summary>
    /// Gets or sets the display label for the bucket.
    /// </summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the conversation count for the bucket.
    /// </summary>
    public int ConversationCount { get; set; }
}

/// <summary>
/// Represents a daily conversation trend series.
/// </summary>
public class AnalyticsTimeseriesDto
{
    /// <summary>
    /// Gets or sets the daily trend points.
    /// </summary>
    public List<AnalyticsTimeseriesPointDto> Points { get; set; } = [];
}

/// <summary>
/// Represents one analytics breakdown row for a bot or deployment.
/// </summary>
public class AnalyticsBreakdownItemDto
{
    /// <summary>
    /// Gets or sets the identifier of the grouped item.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the grouped item name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the total conversation count.
    /// </summary>
    public int ConversationCount { get; set; }

    /// <summary>
    /// Gets or sets the completed conversation count.
    /// </summary>
    public int CompletedConversationCount { get; set; }

    /// <summary>
    /// Gets or sets the awaiting-input conversation count.
    /// </summary>
    public int AwaitingInputConversationCount { get; set; }

    /// <summary>
    /// Gets or sets the active conversation count.
    /// </summary>
    public int ActiveConversationCount { get; set; }

    /// <summary>
    /// Gets or sets the total transcript message count.
    /// </summary>
    public int TotalMessageCount { get; set; }
}

/// <summary>
/// Represents grouped analytics breakdowns for bots, deployments, and statuses.
/// </summary>
public class AnalyticsBreakdownDto
{
    /// <summary>
    /// Gets or sets the top bots in the current filter.
    /// </summary>
    public List<AnalyticsBreakdownItemDto> TopBots { get; set; } = [];

    /// <summary>
    /// Gets or sets the top deployments in the current filter.
    /// </summary>
    public List<AnalyticsBreakdownItemDto> TopDeployments { get; set; } = [];

    /// <summary>
    /// Gets or sets the completed conversation count.
    /// </summary>
    public int CompletedCount { get; set; }

    /// <summary>
    /// Gets or sets the awaiting-input conversation count.
    /// </summary>
    public int AwaitingInputCount { get; set; }

    /// <summary>
    /// Gets or sets the active conversation count.
    /// </summary>
    public int ActiveCount { get; set; }
}
