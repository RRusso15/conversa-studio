using System.Threading.Tasks;
using Abp.Application.Services;
using ConversaStudio.Services.Bots.Dto;

namespace ConversaStudio.Services.Bots;

/// <summary>
/// Generates builder-ready bot graphs from prompts.
/// </summary>
public interface IBotGenerationAppService : IApplicationService
{
    Task<GeneratedBotGraphDto> GenerateFromPrompt(GenerateBotGraphFromPromptRequest input);
}
