using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using ConversaStudio.Controllers;
using ConversaStudio.Services.Billing;
using ConversaStudio.Services.Billing.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConversaStudio.Web.Host.Controllers
{
    /// <summary>
    /// Receives PayPal billing webhooks and forwards them to the billing sync layer.
    /// </summary>
    [AllowAnonymous]
    [ApiController]
    [IgnoreAntiforgeryToken]
    [Route("api/webhooks/paypal")]
    public class PayPalWebhooksController : ConversaStudioControllerBase
    {
        private readonly IPayPalWebhookAppService _payPalWebhookAppService;

        public PayPalWebhooksController(IPayPalWebhookAppService payPalWebhookAppService)
        {
            _payPalWebhookAppService = payPalWebhookAppService;
        }

        [HttpPost]
        public async Task<IActionResult> Receive()
        {
            using (var reader = new StreamReader(Request.Body))
            {
                var rawBody = await reader.ReadToEndAsync();
                var eventDocument = JsonDocument.Parse(string.IsNullOrWhiteSpace(rawBody) ? "{}" : rawBody);
                var webhookRequest = new PayPalWebhookRequest
                {
                    TransmissionId = Request.Headers["Paypal-Transmission-Id"].ToString(),
                    TransmissionTime = Request.Headers["Paypal-Transmission-Time"].ToString(),
                    TransmissionSignature = Request.Headers["Paypal-Transmission-Sig"].ToString(),
                    CertUrl = Request.Headers["Paypal-Cert-Url"].ToString(),
                    AuthAlgorithm = Request.Headers["Paypal-Auth-Algo"].ToString(),
                    RawBody = rawBody,
                    EventDocument = JsonDocument.Parse(eventDocument.RootElement.GetRawText())
                };

                await _payPalWebhookAppService.ProcessWebhookAsync(webhookRequest);
                return Ok();
            }
        }
    }
}
