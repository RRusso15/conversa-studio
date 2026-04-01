using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Abp.Dependency;

namespace ConversaStudio.Services.AiKnowledge;

/// <summary>
/// Wraps Gemini generation and embedding calls for bot-scoped AI workflows.
/// </summary>
public class GeminiAiClient : ITransientDependency
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    private readonly IHttpClientFactory _httpClientFactory;

    public GeminiAiClient(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Generates an embedding vector for the supplied content.
    /// </summary>
    public async Task<List<float>> EmbedAsync(string apiKey, string model, string content, CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient();
        var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{Uri.EscapeDataString(model)}:embedContent?key={Uri.EscapeDataString(apiKey)}";
        var requestPayload = new
        {
            content = new
            {
                parts = new[]
                {
                    new
                    {
                        text = content
                    }
                }
            }
        };

        using var response = await client.PostAsync(
            endpoint,
            new StringContent(JsonSerializer.Serialize(requestPayload, JsonOptions), Encoding.UTF8, "application/json"),
            cancellationToken);
        var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
        response.EnsureSuccessStatusCode();

        using var document = JsonDocument.Parse(responseText);
        if (!document.RootElement.TryGetProperty("embedding", out var embeddingElement) ||
            !embeddingElement.TryGetProperty("values", out var valuesElement) ||
            valuesElement.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return valuesElement.EnumerateArray()
            .Where(value => value.ValueKind == JsonValueKind.Number)
            .Select(value => value.GetSingle())
            .ToList();
    }

    /// <summary>
    /// Generates a grounded model response from a prepared prompt.
    /// </summary>
    public async Task<string> GenerateAsync(string apiKey, string model, string prompt, CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient();
        var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{Uri.EscapeDataString(model)}:generateContent?key={Uri.EscapeDataString(apiKey)}";
        var requestPayload = new
        {
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new[]
                    {
                        new
                        {
                            text = prompt
                        }
                    }
                }
            }
        };

        using var response = await client.PostAsync(
            endpoint,
            new StringContent(JsonSerializer.Serialize(requestPayload, JsonOptions), Encoding.UTF8, "application/json"),
            cancellationToken);
        var responseText = await response.Content.ReadAsStringAsync(cancellationToken);
        response.EnsureSuccessStatusCode();

        using var document = JsonDocument.Parse(responseText);
        if (!document.RootElement.TryGetProperty("candidates", out var candidatesElement) ||
            candidatesElement.ValueKind != JsonValueKind.Array)
        {
            return string.Empty;
        }

        foreach (var candidate in candidatesElement.EnumerateArray())
        {
            if (!candidate.TryGetProperty("content", out var contentElement) ||
                !contentElement.TryGetProperty("parts", out var partsElement) ||
                partsElement.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            var text = string.Join(
                "\n",
                partsElement.EnumerateArray()
                    .Where(part => part.TryGetProperty("text", out _))
                    .Select(part => part.GetProperty("text").GetString()?.Trim() ?? string.Empty)
                    .Where(partText => !string.IsNullOrWhiteSpace(partText)));

            if (!string.IsNullOrWhiteSpace(text))
            {
                return text;
            }
        }

        return string.Empty;
    }
}
