using System;
using System.Collections.Generic;
using Abp.Application.Services.Dto;

namespace ConversaStudio.Services.Transcripts.Dto;

/// <summary>
/// Defines the query parameters used to fetch transcript sessions.
/// </summary>
public class GetTranscriptsRequest : PagedResultRequestDto
{
    /// <summary>
    /// Gets or sets the optional bot identifier filter.
    /// </summary>
    public Guid? BotId { get; set; }

    /// <summary>
    /// Gets or sets the optional transcript status filter.
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the optional search text.
    /// </summary>
    public string SearchText { get; set; } = string.Empty;
}

/// <summary>
/// Represents one transcript session summary in the transcript inbox.
/// </summary>
public class TranscriptSessionSummaryDto
{
    /// <summary>
    /// Gets or sets the runtime session identifier.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the bot identifier.
    /// </summary>
    public Guid BotId { get; set; }

    /// <summary>
    /// Gets or sets the bot name.
    /// </summary>
    public string BotName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the deployment identifier.
    /// </summary>
    public Guid DeploymentId { get; set; }

    /// <summary>
    /// Gets or sets the deployment name.
    /// </summary>
    public string DeploymentName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the public session token.
    /// </summary>
    public string SessionToken { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets when the session was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets when the session was last updated.
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Gets or sets whether the session is awaiting input.
    /// </summary>
    public bool AwaitingInput { get; set; }

    /// <summary>
    /// Gets or sets whether the session is completed.
    /// </summary>
    public bool IsCompleted { get; set; }

    /// <summary>
    /// Gets or sets the published bot version used by the session.
    /// </summary>
    public int PublishedVersion { get; set; }

    /// <summary>
    /// Gets or sets the total number of transcript messages.
    /// </summary>
    public int MessageCount { get; set; }

    /// <summary>
    /// Gets or sets the most recent message preview.
    /// </summary>
    public string LastMessagePreview { get; set; } = string.Empty;
}

/// <summary>
/// Represents one transcript message within a transcript detail view.
/// </summary>
public class TranscriptMessageDto
{
    /// <summary>
    /// Gets or sets the message identifier.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the message role.
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the message content.
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets when the message was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Represents a full transcript session detail payload.
/// </summary>
public class TranscriptDetailDto : TranscriptSessionSummaryDto
{
    /// <summary>
    /// Gets or sets the ordered transcript messages for the session.
    /// </summary>
    public List<TranscriptMessageDto> Messages { get; set; } = [];
}
