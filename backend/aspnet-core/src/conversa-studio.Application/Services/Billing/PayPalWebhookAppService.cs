using System;
using System.Threading.Tasks;
using Abp.Domain.Repositories;
using ConversaStudio.Domains.Billing;
using ConversaStudio.Services.Billing.Dto;
using Microsoft.EntityFrameworkCore;

namespace ConversaStudio.Services.Billing;

/// <summary>
/// Processes verified PayPal webhook events for tenant billing synchronization.
/// </summary>
public class PayPalWebhookAppService : ConversaStudioAppServiceBase, IPayPalWebhookAppService
{
    private readonly IRepository<BillingSubscription, Guid> _billingSubscriptionRepository;
    private readonly IPayPalBillingGateway _payPalBillingGateway;

    public PayPalWebhookAppService(
        IRepository<BillingSubscription, Guid> billingSubscriptionRepository,
        IPayPalBillingGateway payPalBillingGateway)
    {
        _billingSubscriptionRepository = billingSubscriptionRepository;
        _payPalBillingGateway = payPalBillingGateway;
    }

    /// <inheritdoc />
    public async Task ProcessWebhookAsync(PayPalWebhookRequest request)
    {
        if (!await _payPalBillingGateway.VerifyWebhookAsync(request))
        {
            return;
        }

        var eventType = ReadJsonString(request.EventDocument, "event_type");
        var subscriptionId = ReadJsonString(request.EventDocument, "resource", "id");

        if (string.IsNullOrWhiteSpace(subscriptionId))
        {
            subscriptionId = ReadJsonString(request.EventDocument, "resource", "billing_agreement_id");
        }

        if (string.IsNullOrWhiteSpace(subscriptionId))
        {
            return;
        }

        var subscription = await _billingSubscriptionRepository.GetAll()
            .FirstOrDefaultAsync(candidate => candidate.ProviderSubscriptionId == subscriptionId);

        if (subscription == null)
        {
            return;
        }

        var snapshot = await _payPalBillingGateway.GetSubscriptionAsync(subscriptionId);
        var normalizedStatus = NormalizeWebhookStatus(eventType, snapshot.Status);

        subscription.ApplySync(
            subscription.PlanCode,
            subscription.Provider,
            snapshot.SubscriptionId,
            snapshot.PlanId,
            normalizedStatus,
            snapshot.TrialEndsAt,
            snapshot.StartTime,
            snapshot.NextBillingTime,
            snapshot.CanceledAt,
            snapshot.SubscriberEmail,
            snapshot.SubscriberName,
            DateTime.UtcNow);

        await _billingSubscriptionRepository.UpdateAsync(subscription);
        await CurrentUnitOfWork.SaveChangesAsync();
    }

    private static string NormalizeWebhookStatus(string? eventType, string providerStatus)
    {
        if (string.Equals(eventType, "PAYMENT.SALE.COMPLETED", StringComparison.OrdinalIgnoreCase))
        {
            return BillingSubscriptionStatuses.Active;
        }

        if (string.Equals(eventType, "BILLING.SUBSCRIPTION.PAYMENT.FAILED", StringComparison.OrdinalIgnoreCase))
        {
            return BillingSubscriptionStatuses.PastDue;
        }

        if (string.Equals(eventType, "BILLING.SUBSCRIPTION.SUSPENDED", StringComparison.OrdinalIgnoreCase))
        {
            return BillingSubscriptionStatuses.Suspended;
        }

        if (string.Equals(eventType, "BILLING.SUBSCRIPTION.CANCELLED", StringComparison.OrdinalIgnoreCase))
        {
            return BillingSubscriptionStatuses.Cancelled;
        }

        if (string.Equals(eventType, "BILLING.SUBSCRIPTION.EXPIRED", StringComparison.OrdinalIgnoreCase))
        {
            return BillingSubscriptionStatuses.Expired;
        }

        if (string.Equals(eventType, "BILLING.SUBSCRIPTION.ACTIVATED", StringComparison.OrdinalIgnoreCase))
        {
            return BillingSubscriptionStatuses.Active;
        }

        return string.Equals(providerStatus, "ACTIVE", StringComparison.OrdinalIgnoreCase)
            ? BillingSubscriptionStatuses.Active
            : string.Equals(providerStatus, "SUSPENDED", StringComparison.OrdinalIgnoreCase)
                ? BillingSubscriptionStatuses.Suspended
                : string.Equals(providerStatus, "CANCELLED", StringComparison.OrdinalIgnoreCase)
                    ? BillingSubscriptionStatuses.Cancelled
                    : string.Equals(providerStatus, "EXPIRED", StringComparison.OrdinalIgnoreCase)
                        ? BillingSubscriptionStatuses.Expired
                        : BillingSubscriptionStatuses.Inactive;
    }

    private static string ReadJsonString(System.Text.Json.JsonDocument document, params string[] path)
    {
        System.Text.Json.JsonElement currentElement = document.RootElement;
        foreach (var segment in path)
        {
            if (currentElement.ValueKind != System.Text.Json.JsonValueKind.Object ||
                !currentElement.TryGetProperty(segment, out var nextElement))
            {
                return string.Empty;
            }

            currentElement = nextElement;
        }

        return currentElement.ValueKind == System.Text.Json.JsonValueKind.String
            ? currentElement.GetString() ?? string.Empty
            : string.Empty;
    }
}
