using System.Threading.Tasks;
using ConversaStudio.Controllers;
using ConversaStudio.Services.Runtime;
using ConversaStudio.Services.Runtime.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConversaStudio.Web.Host.Controllers
{
    /// <summary>
    /// Exposes anonymous widget bootstrap and runtime endpoints for active deployments.
    /// </summary>
    [AllowAnonymous]
    [ApiController]
    [IgnoreAntiforgeryToken]
    [Route("api/widget/deployments")]
    public class WidgetDeploymentsController : ConversaStudioControllerBase
    {
        private readonly IWidgetRuntimeAppService _widgetRuntimeAppService;

        public WidgetDeploymentsController(IWidgetRuntimeAppService widgetRuntimeAppService)
        {
            _widgetRuntimeAppService = widgetRuntimeAppService;
        }

        [HttpGet("{deploymentKey}/bootstrap")]
        public async Task<ActionResult<WidgetBootstrapDto>> GetBootstrap(string deploymentKey)
        {
            return await _widgetRuntimeAppService.GetBootstrapAsync(deploymentKey, ResolveEmbedOrigin());
        }

        [HttpPost("{deploymentKey}/sessions")]
        public async Task<ActionResult<WidgetSessionResponseDto>> StartSession(string deploymentKey, [FromBody] StartWidgetSessionRequest input)
        {
            return await _widgetRuntimeAppService.StartSessionAsync(deploymentKey, ResolveEmbedOrigin(), input ?? new StartWidgetSessionRequest());
        }

        [HttpPost("{deploymentKey}/sessions/{sessionId}/messages")]
        public async Task<ActionResult<WidgetSessionResponseDto>> SendMessage(
            string deploymentKey,
            string sessionId,
            [FromBody] SendWidgetMessageRequest input)
        {
            return await _widgetRuntimeAppService.SendMessageAsync(deploymentKey, sessionId, ResolveEmbedOrigin(), input ?? new SendWidgetMessageRequest());
        }

        private string ResolveEmbedOrigin()
        {
            if (Request.Headers.TryGetValue("X-Conversa-Embed-Origin", out var values))
            {
                return values.ToString();
            }

            return string.Empty;
        }
    }
}
