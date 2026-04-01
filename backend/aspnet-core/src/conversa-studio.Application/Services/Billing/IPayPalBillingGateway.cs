using System.Threading.Tasks;
using ConversaStudio.Services.Billing.Dto;

namespace ConversaStudio.Services.Billing;

/// <summary>
/// Encapsulates PayPal subscription API calls.
/// </summary>
public interface IPayPalBillingGateway
{
    /// <summary>
    /// Returns true when PayPal billing is configured for the host environment.
    /// </summary>
    bool IsConfigured();

    /// <summary>
    /// Loads subscription details from PayPal.
    /// </summary>
    Task<PayPalSubscriptionSnapshot> GetSubscriptionAsync(string subscriptionId);

    /// <summary>
    /// Cancels a PayPal subscription.
    /// </summary>
    Task CancelSubscriptionAsync(string subscriptionId, string reason);

    /// <summary>
    /// Verifies a webhook signature against PayPal.
    /// </summary>
    Task<bool> VerifyWebhookAsync(PayPalWebhookRequest request);
}
