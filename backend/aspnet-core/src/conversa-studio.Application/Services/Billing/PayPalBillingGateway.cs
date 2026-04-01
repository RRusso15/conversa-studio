using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Abp.UI;
using ConversaStudio.Services.Billing.Dto;
using Microsoft.Extensions.Configuration;

namespace ConversaStudio.Services.Billing;

/// <summary>
/// Implements PayPal subscription API access for tenant billing flows.
/// </summary>
public class PayPalBillingGateway : IPayPalBillingGateway
{
    private const string SandboxApiBaseUrl = "https://api-m.sandbox.paypal.com";
    private const string LiveApiBaseUrl = "https://api-m.paypal.com";
    private const string PayPalEnvironmentSandbox = "sandbox";
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public PayPalBillingGateway(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    /// <inheritdoc />
    public bool IsConfigured()
    {
        return !string.IsNullOrWhiteSpace(GetClientId()) &&
               !string.IsNullOrWhiteSpace(GetClientSecret()) &&
               !string.IsNullOrWhiteSpace(GetPlanId());
    }

    /// <inheritdoc />
    public async Task<PayPalSubscriptionSnapshot> GetSubscriptionAsync(string subscriptionId)
    {
        EnsureCoreConfiguration();

        var accessToken = await GetAccessTokenAsync();
        var client = CreateClient(accessToken);
        var response = await client.GetAsync($"/v1/billing/subscriptions/{Uri.EscapeDataString(subscriptionId)}");
        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new UserFriendlyException("PayPal could not verify this subscription yet.");
        }

        var payload = JsonSerializer.Deserialize<PayPalSubscriptionResponse>(content, SerializerOptions)
            ?? throw new UserFriendlyException("PayPal returned an invalid subscription payload.");

        return new PayPalSubscriptionSnapshot
        {
            SubscriptionId = payload.Id ?? subscriptionId,
            PlanId = payload.PlanId ?? string.Empty,
            Status = payload.Status ?? string.Empty,
            StartTime = ParseDateTime(payload.StartTime),
            NextBillingTime = ParseDateTime(payload.BillingInfo?.NextBillingTime),
            TrialEndsAt = ParseDateTime(payload.BillingInfo?.CycleExecutions),
            CanceledAt = ParseDateTime(payload.StatusUpdateTime),
            SubscriberEmail = payload.Subscriber?.EmailAddress,
            SubscriberName = BuildSubscriberName(payload.Subscriber?.Name)
        };
    }

    /// <inheritdoc />
    public async Task CancelSubscriptionAsync(string subscriptionId, string reason)
    {
        EnsureCoreConfiguration();

        var accessToken = await GetAccessTokenAsync();
        var client = CreateClient(accessToken);
        var body = JsonSerializer.Serialize(new
        {
            reason
        });
        var response = await client.PostAsync(
            $"/v1/billing/subscriptions/{Uri.EscapeDataString(subscriptionId)}/cancel",
            new StringContent(body, Encoding.UTF8, "application/json"));

        if (!response.IsSuccessStatusCode)
        {
            throw new UserFriendlyException("PayPal could not cancel this subscription.");
        }
    }

    /// <inheritdoc />
    public async Task<bool> VerifyWebhookAsync(PayPalWebhookRequest request)
    {
        EnsureCoreConfiguration();

        if (string.IsNullOrWhiteSpace(GetWebhookId()))
        {
            return false;
        }

        var accessToken = await GetAccessTokenAsync();
        var client = CreateClient(accessToken);
        var payload = JsonSerializer.Serialize(new
        {
            auth_algo = request.AuthAlgorithm,
            cert_url = request.CertUrl,
            transmission_id = request.TransmissionId,
            transmission_sig = request.TransmissionSignature,
            transmission_time = request.TransmissionTime,
            webhook_id = GetWebhookId(),
            webhook_event = JsonSerializer.Deserialize<object>(request.RawBody, SerializerOptions)
        });

        var response = await client.PostAsync(
            "/v1/notifications/verify-webhook-signature",
            new StringContent(payload, Encoding.UTF8, "application/json"));

        if (!response.IsSuccessStatusCode)
        {
            return false;
        }

        var content = await response.Content.ReadAsStringAsync();
        var verification = JsonSerializer.Deserialize<PayPalWebhookVerificationResponse>(content, SerializerOptions);
        return string.Equals(verification?.VerificationStatus, "SUCCESS", StringComparison.OrdinalIgnoreCase);
    }

    private async Task<string> GetAccessTokenAsync()
    {
        var client = new HttpClient
        {
            BaseAddress = new Uri(GetApiBaseUrl())
        };
        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{GetClientId()}:{GetClientSecret()}"));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

        var response = await client.PostAsync(
            "/v1/oauth2/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials"
            }));

        var content = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            throw new UserFriendlyException("PayPal authentication is not configured correctly.");
        }

        var tokenPayload = JsonSerializer.Deserialize<PayPalAccessTokenResponse>(content, SerializerOptions);
        if (string.IsNullOrWhiteSpace(tokenPayload?.AccessToken))
        {
            throw new UserFriendlyException("PayPal authentication did not return an access token.");
        }

        return tokenPayload.AccessToken;
    }

    private HttpClient CreateClient(string accessToken)
    {
        var client = _httpClientFactory.CreateClient();
        client.BaseAddress = new Uri(GetApiBaseUrl());
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        return client;
    }

    private string GetApiBaseUrl()
    {
        return string.Equals(GetEnvironment(), PayPalEnvironmentSandbox, StringComparison.OrdinalIgnoreCase)
            ? SandboxApiBaseUrl
            : LiveApiBaseUrl;
    }

    private string GetEnvironment()
    {
        return _configuration["PayPal:Environment"]?.Trim() ?? PayPalEnvironmentSandbox;
    }

    private string GetClientId()
    {
        return _configuration["PayPal:ClientId"]?.Trim() ?? string.Empty;
    }

    private string GetClientSecret()
    {
        return _configuration["PayPal:ClientSecret"]?.Trim() ?? string.Empty;
    }

    private string GetPlanId()
    {
        return _configuration["PayPal:PlanId"]?.Trim() ?? string.Empty;
    }

    private string GetWebhookId()
    {
        return _configuration["PayPal:WebhookId"]?.Trim() ?? string.Empty;
    }

    private void EnsureCoreConfiguration()
    {
        if (!IsConfigured())
        {
            throw new UserFriendlyException("PayPal billing is not configured on this workspace host yet.");
        }
    }

    private static DateTime? ParseDateTime(string? value)
    {
        if (!DateTime.TryParse(value, out var parsed))
        {
            return null;
        }

        return parsed.Kind == DateTimeKind.Utc ? parsed : parsed.ToUniversalTime();
    }

    private static DateTime? ParseDateTime(List<PayPalCycleExecution>? cycleExecutions)
    {
        if (cycleExecutions == null || cycleExecutions.Count == 0)
        {
            return null;
        }

        var trialCycle = cycleExecutions.Find(cycleExecution =>
            string.Equals(cycleExecution.TenureType, "TRIAL", StringComparison.OrdinalIgnoreCase) &&
            cycleExecution.TotalCycles > 0);

        return ParseDateTime(trialCycle?.NextBillingTime);
    }

    private static string? BuildSubscriberName(PayPalSubscriberName? name)
    {
        if (name == null)
        {
            return null;
        }

        var segments = new List<string>();
        if (!string.IsNullOrWhiteSpace(name.GivenName))
        {
            segments.Add(name.GivenName);
        }

        if (!string.IsNullOrWhiteSpace(name.Surname))
        {
            segments.Add(name.Surname);
        }

        var fullName = string.Join(" ", segments);
        return string.IsNullOrWhiteSpace(fullName) ? null : fullName;
    }

    private class PayPalAccessTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }
    }

    private class PayPalSubscriptionResponse
    {
        public string? Id { get; set; }

        [JsonPropertyName("plan_id")]
        public string? PlanId { get; set; }

        public string? Status { get; set; }

        [JsonPropertyName("start_time")]
        public string? StartTime { get; set; }

        [JsonPropertyName("status_update_time")]
        public string? StatusUpdateTime { get; set; }

        public PayPalSubscriber? Subscriber { get; set; }

        public PayPalBillingInfo? BillingInfo { get; set; }
    }

    private class PayPalSubscriber
    {
        [JsonPropertyName("email_address")]
        public string? EmailAddress { get; set; }

        public PayPalSubscriberName? Name { get; set; }
    }

    private class PayPalSubscriberName
    {
        [JsonPropertyName("given_name")]
        public string? GivenName { get; set; }

        [JsonPropertyName("surname")]
        public string? Surname { get; set; }
    }

    private class PayPalBillingInfo
    {
        [JsonPropertyName("next_billing_time")]
        public string? NextBillingTime { get; set; }

        [JsonPropertyName("cycle_executions")]
        public List<PayPalCycleExecution>? CycleExecutions { get; set; }
    }

    private class PayPalCycleExecution
    {
        [JsonPropertyName("tenure_type")]
        public string? TenureType { get; set; }

        [JsonPropertyName("total_cycles")]
        public int TotalCycles { get; set; }

        [JsonPropertyName("next_billing_time")]
        public string? NextBillingTime { get; set; }
    }

    private class PayPalWebhookVerificationResponse
    {
        [JsonPropertyName("verification_status")]
        public string? VerificationStatus { get; set; }
    }
}
