using System.Threading.Tasks;
using ConversaStudio.Services.Runtime.Dto;

namespace ConversaStudio.Services.Runtime;

/// <summary>
/// Defines runtime execution workflows for public widget conversations.
/// </summary>
public interface IWidgetRuntimeAppService
{
    /// <summary>
    /// Returns bootstrap data for an active deployment.
    /// </summary>
    Task<WidgetBootstrapDto> GetBootstrapAsync(string deploymentKey, string embedOrigin);

    /// <summary>
    /// Creates or resumes a widget conversation session.
    /// </summary>
    Task<WidgetSessionResponseDto> StartSessionAsync(string deploymentKey, string embedOrigin, StartWidgetSessionRequest input);

    /// <summary>
    /// Continues a widget conversation with a user message.
    /// </summary>
    Task<WidgetSessionResponseDto> SendMessageAsync(string deploymentKey, string sessionId, string embedOrigin, SendWidgetMessageRequest input);
}
