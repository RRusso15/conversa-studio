using System.Threading.Tasks;
using Abp.Application.Services;
using ConversaStudio.Services.Billing.Dto;

namespace ConversaStudio.Services.Billing;

/// <summary>
/// Exposes tenant-scoped billing flows for the developer workspace.
/// </summary>
public interface IBillingAppService : IApplicationService
{
    /// <summary>
    /// Returns the current tenant billing overview.
    /// </summary>
    Task<BillingOverviewDto> GetBillingOverview();

    /// <summary>
    /// Returns the current PayPal client configuration for the billing page.
    /// </summary>
    Task<BillingPortalConfigDto> GetBillingPortalConfig();

    /// <summary>
    /// Confirms and persists a PayPal subscription approval.
    /// </summary>
    Task<BillingOverviewDto> ConfirmPayPalSubscription(ConfirmPayPalSubscriptionRequest input);

    /// <summary>
    /// Cancels the current tenant subscription when one exists.
    /// </summary>
    Task<BillingOverviewDto> CancelSubscription();
}
