using System;
using Abp.Domain.Entities.Auditing;

namespace ConversaStudio.Domains.Billing;

/// <summary>
/// Stores the tenant-scoped subscription state synchronized from the payment provider.
/// </summary>
public class BillingSubscription : FullAuditedEntity<Guid>
{
    public const int MaxPlanCodeLength = 32;
    public const int MaxProviderLength = 32;
    public const int MaxStatusLength = 32;
    public const int MaxProviderSubscriptionIdLength = 128;
    public const int MaxProviderPlanIdLength = 128;
    public const int MaxPayerEmailLength = 256;
    public const int MaxSubscriberNameLength = 256;

    /// <summary>
    /// Gets or sets the owning tenant identifier.
    /// </summary>
    public int TenantId { get; set; }

    /// <summary>
    /// Gets or sets the normalized application plan code.
    /// </summary>
    public string PlanCode { get; set; } = BillingPlanCodes.Free;

    /// <summary>
    /// Gets or sets the external billing provider.
    /// </summary>
    public string Provider { get; set; } = BillingProviders.PayPal;

    /// <summary>
    /// Gets or sets the provider subscription identifier.
    /// </summary>
    public string ProviderSubscriptionId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the provider plan identifier.
    /// </summary>
    public string ProviderPlanId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the normalized lifecycle status.
    /// </summary>
    public string Status { get; set; } = BillingSubscriptionStatuses.Inactive;

    /// <summary>
    /// Gets or sets the trial end date in UTC when available.
    /// </summary>
    public DateTime? TrialEndsAt { get; set; }

    /// <summary>
    /// Gets or sets the current billing period start date in UTC when available.
    /// </summary>
    public DateTime? CurrentPeriodStartAt { get; set; }

    /// <summary>
    /// Gets or sets the current billing period end date in UTC when available.
    /// </summary>
    public DateTime? CurrentPeriodEndAt { get; set; }

    /// <summary>
    /// Gets or sets the cancellation date in UTC when available.
    /// </summary>
    public DateTime? CanceledAt { get; set; }

    /// <summary>
    /// Gets or sets the last successful provider synchronization date in UTC.
    /// </summary>
    public DateTime? LastSyncedAt { get; set; }

    /// <summary>
    /// Gets or sets the payer email snapshot when available.
    /// </summary>
    public string? PayerEmail { get; set; }

    /// <summary>
    /// Gets or sets the subscriber display name snapshot when available.
    /// </summary>
    public string? SubscriberName { get; set; }

    /// <summary>
    /// Initializes an empty instance for EF Core.
    /// </summary>
    public BillingSubscription()
    {
    }

    /// <summary>
    /// Initializes a new tenant billing subscription record.
    /// </summary>
    public BillingSubscription(Guid id, int tenantId, string planCode, string provider)
    {
        Id = id;
        TenantId = tenantId;
        PlanCode = planCode;
        Provider = provider;
        Status = BillingSubscriptionStatuses.Inactive;
    }

    /// <summary>
    /// Applies a synchronized snapshot from the payment provider.
    /// </summary>
    public void ApplySync(
        string planCode,
        string provider,
        string providerSubscriptionId,
        string providerPlanId,
        string status,
        DateTime? trialEndsAt,
        DateTime? currentPeriodStartAt,
        DateTime? currentPeriodEndAt,
        DateTime? canceledAt,
        string? payerEmail,
        string? subscriberName,
        DateTime syncedAt)
    {
        PlanCode = planCode;
        Provider = provider;
        ProviderSubscriptionId = providerSubscriptionId;
        ProviderPlanId = providerPlanId;
        Status = status;
        TrialEndsAt = trialEndsAt;
        CurrentPeriodStartAt = currentPeriodStartAt;
        CurrentPeriodEndAt = currentPeriodEndAt;
        CanceledAt = canceledAt;
        PayerEmail = payerEmail;
        SubscriberName = subscriberName;
        LastSyncedAt = syncedAt;
    }
}
