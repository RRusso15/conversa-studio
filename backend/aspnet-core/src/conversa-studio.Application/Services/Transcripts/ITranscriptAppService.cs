using System;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using ConversaStudio.Services.Transcripts.Dto;

namespace ConversaStudio.Services.Transcripts;

/// <summary>
/// Defines developer-facing transcript query workflows.
/// </summary>
public interface ITranscriptAppService : IApplicationService
{
    /// <summary>
    /// Returns paged transcript session summaries for the current developer.
    /// </summary>
    Task<PagedResultDto<TranscriptSessionSummaryDto>> GetTranscripts(GetTranscriptsRequest input);

    /// <summary>
    /// Returns one transcript session with its ordered messages.
    /// </summary>
    Task<TranscriptDetailDto> GetTranscript(EntityDto<Guid> input);
}
