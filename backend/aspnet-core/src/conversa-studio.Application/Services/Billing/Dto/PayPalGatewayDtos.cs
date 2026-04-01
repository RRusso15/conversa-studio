using System;
using System.Text.Json;

namespace ConversaStudio.Services.Billing.Dto;

/// <summary>
/// Represents a normalized PayPal subscription snapshot.
/// </summary>
public class PayPalSubscriptionSnapshot
{
    public string SubscriptionId { get; set; } = string.Empty;

    public string PlanId { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime? StartTime { get; set; }

    public DateTime? NextBillingTime { get; set; }

    public DateTime? TrialEndsAt { get; set; }

    public DateTime? CanceledAt { get; set; }

    public string? SubscriberName { get; set; }

    public string? SubscriberEmail { get; set; }
}

/// <summary>
/// Captures a raw PayPal webhook event for verification and processing.
/// </summary>
public class PayPalWebhookRequest
{
    public string TransmissionId { get; set; } = string.Empty;

    public string TransmissionTime { get; set; } = string.Empty;

    public string TransmissionSignature { get; set; } = string.Empty;

    public string CertUrl { get; set; } = string.Empty;

    public string AuthAlgorithm { get; set; } = string.Empty;

    public string RawBody { get; set; } = string.Empty;

    public JsonDocument EventDocument { get; set; } = JsonDocument.Parse("{}");
}
