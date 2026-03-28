using System.Threading.Tasks;
using Abp.UI;
using ConversaStudio.Controllers;
using ConversaStudio.Services.Runtime;
using ConversaStudio.Services.Runtime.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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
            try
            {
                return await _widgetRuntimeAppService.GetBootstrapAsync(deploymentKey, ResolveEmbedOrigin());
            }
            catch (UserFriendlyException exception)
            {
                return BuildWidgetErrorResponse(exception);
            }
        }

        [HttpPost("{deploymentKey}/sessions")]
        public async Task<ActionResult<WidgetSessionResponseDto>> StartSession(string deploymentKey, [FromBody] StartWidgetSessionRequest input)
        {
            try
            {
                return await _widgetRuntimeAppService.StartSessionAsync(deploymentKey, ResolveEmbedOrigin(), input ?? new StartWidgetSessionRequest());
            }
            catch (UserFriendlyException exception)
            {
                return BuildWidgetErrorResponse(exception);
            }
        }

        [HttpPost("{deploymentKey}/sessions/{sessionId}/messages")]
        public async Task<ActionResult<WidgetSessionResponseDto>> SendMessage(
            string deploymentKey,
            string sessionId,
            [FromBody] SendWidgetMessageRequest input)
        {
            try
            {
                return await _widgetRuntimeAppService.SendMessageAsync(deploymentKey, sessionId, ResolveEmbedOrigin(), input ?? new SendWidgetMessageRequest());
            }
            catch (UserFriendlyException exception)
            {
                return BuildWidgetErrorResponse(exception);
            }
        }

        private string ResolveEmbedOrigin()
        {
            if (Request.Headers.TryGetValue("X-Conversa-Embed-Origin", out var values))
            {
                return values.ToString();
            }

            return string.Empty;
        }

        private ActionResult BuildWidgetErrorResponse(UserFriendlyException exception)
        {
            var message = exception.Message?.Trim() ?? "The widget request could not be processed.";

            if (message.Contains("could not be found", System.StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { error = message });
            }

            if (message.Contains("not allowed", System.StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { error = message });
            }

            if (message.Contains("not active", System.StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status409Conflict, new { error = message });
            }

            return BadRequest(new { error = message });
        }
    }
}
