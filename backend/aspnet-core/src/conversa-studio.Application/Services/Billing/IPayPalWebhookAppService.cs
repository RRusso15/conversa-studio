using System.Threading.Tasks;
using Abp.Application.Services;
using ConversaStudio.Services.Billing.Dto;

namespace ConversaStudio.Services.Billing;

/// <summary>
/// Processes PayPal webhook notifications for tenant billing updates.
/// </summary>
public interface IPayPalWebhookAppService : IApplicationService
{
    /// <summary>
    /// Processes one PayPal webhook payload and synchronizes any matching subscription.
    /// </summary>
    Task ProcessWebhookAsync(PayPalWebhookRequest request);
}
