namespace ConversaStudio.Domains.Billing;

/// <summary>
/// Defines normalized tenant billing statuses.
/// </summary>
public static class BillingSubscriptionStatuses
{
    public const string Inactive = "inactive";
    public const string ApprovalPending = "approval_pending";
    public const string Trialing = "trialing";
    public const string Active = "active";
    public const string PastDue = "past_due";
    public const string Suspended = "suspended";
    public const string Cancelled = "cancelled";
    public const string Expired = "expired";
}
