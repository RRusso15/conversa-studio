using System;

namespace ConversaStudio.Services.Billing.Dto;

/// <summary>
/// Represents tenant billing state for the developer workspace.
/// </summary>
public class BillingOverviewDto
{
    public string PlanCode { get; set; } = string.Empty;

    public string PlanName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string Provider { get; set; } = string.Empty;

    public string PriceLabel { get; set; } = string.Empty;

    public string TrialLabel { get; set; } = string.Empty;

    public string? ProviderSubscriptionId { get; set; }

    public DateTime? TrialEndsAt { get; set; }

    public DateTime? CurrentPeriodStartAt { get; set; }

    public DateTime? CurrentPeriodEndAt { get; set; }

    public DateTime? CanceledAt { get; set; }

    public DateTime? LastSyncedAt { get; set; }

    public string? PayerEmail { get; set; }

    public string? SubscriberName { get; set; }

    public bool CanStartSubscription { get; set; }

    public bool CanCancelSubscription { get; set; }
}

/// <summary>
/// Represents PayPal client-side billing configuration for the workspace.
/// </summary>
public class BillingPortalConfigDto
{
    public string Provider { get; set; } = string.Empty;

    public string ClientId { get; set; } = string.Empty;

    public string PlanId { get; set; } = string.Empty;

    public string Environment { get; set; } = string.Empty;

    public string PlanCode { get; set; } = string.Empty;

    public string PlanName { get; set; } = string.Empty;

    public string PriceLabel { get; set; } = string.Empty;

    public string TrialLabel { get; set; } = string.Empty;

    public bool IsAvailable { get; set; }

    public string? UnavailableReason { get; set; }
}

/// <summary>
/// Captures a PayPal subscription approval from the frontend checkout flow.
/// </summary>
public class ConfirmPayPalSubscriptionRequest
{
    public string SubscriptionId { get; set; } = string.Empty;
}
