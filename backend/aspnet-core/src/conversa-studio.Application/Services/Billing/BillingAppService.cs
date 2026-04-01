using System;
using System.Threading.Tasks;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using ConversaStudio.Domains.Billing;
using ConversaStudio.Services.Billing.Dto;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;

namespace ConversaStudio.Services.Billing;

/// <summary>
/// Exposes tenant-scoped billing flows to signed-in workspace users.
/// </summary>
[AbpAuthorize]
public class BillingAppService : ConversaStudioAppServiceBase, IBillingAppService
{
    private readonly IRepository<BillingSubscription, Guid> _billingSubscriptionRepository;
    private readonly IPayPalBillingGateway _payPalBillingGateway;
    private readonly IConfiguration _configuration;

    public BillingAppService(
        IRepository<BillingSubscription, Guid> billingSubscriptionRepository,
        IPayPalBillingGateway payPalBillingGateway,
        IConfiguration configuration)
    {
        _billingSubscriptionRepository = billingSubscriptionRepository;
        _payPalBillingGateway = payPalBillingGateway;
        _configuration = configuration;
    }

    /// <inheritdoc />
    [HttpGet]
    public async Task<BillingOverviewDto> GetBillingOverview()
    {
        var tenantId = GetRequiredTenantId();
        var subscription = await GetTenantSubscriptionAsync(tenantId);
        return MapOverview(subscription);
    }

    /// <inheritdoc />
    [HttpGet]
    public Task<BillingPortalConfigDto> GetBillingPortalConfig()
    {
        return Task.FromResult(new BillingPortalConfigDto
        {
            Provider = BillingProviders.PayPal,
            ClientId = _configuration["PayPal:ClientId"]?.Trim() ?? string.Empty,
            PlanId = _configuration["PayPal:PlanId"]?.Trim() ?? string.Empty,
            Environment = _configuration["PayPal:Environment"]?.Trim() ?? "sandbox",
            PlanCode = BillingPlanCodes.Pro,
            PlanName = "Pro",
            PriceLabel = "$1/month",
            TrialLabel = "7-day free trial",
            IsAvailable = _payPalBillingGateway.IsConfigured(),
            UnavailableReason = _payPalBillingGateway.IsConfigured()
                ? null
                : "PayPal billing is not configured on this environment yet."
        });
    }

    /// <inheritdoc />
    [HttpPost]
    public async Task<BillingOverviewDto> ConfirmPayPalSubscription(ConfirmPayPalSubscriptionRequest input)
    {
        if (string.IsNullOrWhiteSpace(input.SubscriptionId))
        {
            throw new UserFriendlyException("A PayPal subscription id is required.");
        }

        var tenantId = GetRequiredTenantId();
        var snapshot = await _payPalBillingGateway.GetSubscriptionAsync(input.SubscriptionId.Trim());
        var normalizedStatus = NormalizeStatus(snapshot);
        var existingSubscription = await GetTenantSubscriptionAsync(tenantId);
        var subscription = existingSubscription
            ?? new BillingSubscription(Guid.NewGuid(), tenantId, BillingPlanCodes.Pro, BillingProviders.PayPal);

        subscription.ApplySync(
            BillingPlanCodes.Pro,
            BillingProviders.PayPal,
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

        if (existingSubscription == null)
        {
            await _billingSubscriptionRepository.InsertAsync(subscription);
        }
        else
        {
            await _billingSubscriptionRepository.UpdateAsync(subscription);
        }

        await CurrentUnitOfWork.SaveChangesAsync();
        return MapOverview(subscription);
    }

    /// <inheritdoc />
    [HttpPost]
    public async Task<BillingOverviewDto> CancelSubscription()
    {
        var tenantId = GetRequiredTenantId();
        var subscription = await GetTenantSubscriptionAsync(tenantId);
        if (subscription == null || string.IsNullOrWhiteSpace(subscription.ProviderSubscriptionId))
        {
            throw new UserFriendlyException("This workspace does not have an active PayPal subscription.");
        }

        await _payPalBillingGateway.CancelSubscriptionAsync(
            subscription.ProviderSubscriptionId,
            "Cancelled by workspace user from Conversa Studio.");

        subscription.ApplySync(
            subscription.PlanCode,
            subscription.Provider,
            subscription.ProviderSubscriptionId,
            subscription.ProviderPlanId,
            BillingSubscriptionStatuses.Cancelled,
            subscription.TrialEndsAt,
            subscription.CurrentPeriodStartAt,
            subscription.CurrentPeriodEndAt,
            DateTime.UtcNow,
            subscription.PayerEmail,
            subscription.SubscriberName,
            DateTime.UtcNow);

        await _billingSubscriptionRepository.UpdateAsync(subscription);
        await CurrentUnitOfWork.SaveChangesAsync();
        return MapOverview(subscription);
    }

    private async Task<BillingSubscription?> GetTenantSubscriptionAsync(int tenantId)
    {
        return await _billingSubscriptionRepository.GetAll()
            .FirstOrDefaultAsync(subscription => subscription.TenantId == tenantId);
    }

    private BillingOverviewDto MapOverview(BillingSubscription? subscription)
    {
        if (subscription == null)
        {
            return new BillingOverviewDto
            {
                PlanCode = BillingPlanCodes.Free,
                PlanName = "Free",
                Status = BillingSubscriptionStatuses.Inactive,
                Provider = BillingProviders.PayPal,
                PriceLabel = "$1/month",
                TrialLabel = "7-day free trial",
                CanStartSubscription = true,
                CanCancelSubscription = false
            };
        }

        var canStartSubscription = !string.Equals(subscription.Status, BillingSubscriptionStatuses.Active, StringComparison.OrdinalIgnoreCase) &&
                                   !string.Equals(subscription.Status, BillingSubscriptionStatuses.Trialing, StringComparison.OrdinalIgnoreCase) &&
                                   !string.Equals(subscription.Status, BillingSubscriptionStatuses.ApprovalPending, StringComparison.OrdinalIgnoreCase);

        var canCancelSubscription = string.Equals(subscription.Status, BillingSubscriptionStatuses.Active, StringComparison.OrdinalIgnoreCase) ||
                                    string.Equals(subscription.Status, BillingSubscriptionStatuses.Trialing, StringComparison.OrdinalIgnoreCase) ||
                                    string.Equals(subscription.Status, BillingSubscriptionStatuses.PastDue, StringComparison.OrdinalIgnoreCase);

        return new BillingOverviewDto
        {
            PlanCode = subscription.PlanCode,
            PlanName = string.Equals(subscription.PlanCode, BillingPlanCodes.Pro, StringComparison.OrdinalIgnoreCase) ? "Pro" : "Free",
            Status = subscription.Status,
            Provider = subscription.Provider,
            PriceLabel = "$1/month",
            TrialLabel = "7-day free trial",
            ProviderSubscriptionId = subscription.ProviderSubscriptionId,
            TrialEndsAt = subscription.TrialEndsAt,
            CurrentPeriodStartAt = subscription.CurrentPeriodStartAt,
            CurrentPeriodEndAt = subscription.CurrentPeriodEndAt,
            CanceledAt = subscription.CanceledAt,
            LastSyncedAt = subscription.LastSyncedAt,
            PayerEmail = subscription.PayerEmail,
            SubscriberName = subscription.SubscriberName,
            CanStartSubscription = canStartSubscription,
            CanCancelSubscription = canCancelSubscription
        };
    }

    private int GetRequiredTenantId()
    {
        if (!AbpSession.TenantId.HasValue)
        {
            throw new UserFriendlyException("Billing is only available inside a tenant workspace.");
        }

        return AbpSession.TenantId.Value;
    }

    private static string NormalizeStatus(PayPalSubscriptionSnapshot snapshot)
    {
        var payPalStatus = snapshot.Status;
        if (string.Equals(payPalStatus, "APPROVAL_PENDING", StringComparison.OrdinalIgnoreCase))
        {
            return BillingSubscriptionStatuses.ApprovalPending;
        }

        if (string.Equals(payPalStatus, "APPROVED", StringComparison.OrdinalIgnoreCase))
        {
            return BillingSubscriptionStatuses.ApprovalPending;
        }

        if (string.Equals(payPalStatus, "ACTIVE", StringComparison.OrdinalIgnoreCase))
        {
            return snapshot.TrialEndsAt.HasValue && snapshot.TrialEndsAt.Value > DateTime.UtcNow
                ? BillingSubscriptionStatuses.Trialing
                : BillingSubscriptionStatuses.Active;
        }

        if (string.Equals(payPalStatus, "SUSPENDED", StringComparison.OrdinalIgnoreCase))
        {
            return BillingSubscriptionStatuses.Suspended;
        }

        if (string.Equals(payPalStatus, "CANCELLED", StringComparison.OrdinalIgnoreCase))
        {
            return BillingSubscriptionStatuses.Cancelled;
        }

        if (string.Equals(payPalStatus, "EXPIRED", StringComparison.OrdinalIgnoreCase))
        {
            return BillingSubscriptionStatuses.Expired;
        }

        return BillingSubscriptionStatuses.Inactive;
    }
}
