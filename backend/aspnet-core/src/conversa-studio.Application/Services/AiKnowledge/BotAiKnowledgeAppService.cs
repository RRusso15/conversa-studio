using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Runtime.Security;
using Abp.UI;
using AngleSharp.Html.Parser;
using ConversaStudio.Authorization;
using ConversaStudio.Domains.AiKnowledge;
using ConversaStudio.Domains.Bots;
using ConversaStudio.Services.AiKnowledge.Dto;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UglyToad.PdfPig;

namespace ConversaStudio.Services.AiKnowledge;

/// <summary>
/// Manages bot-scoped AI settings and ingested knowledge outside the graph JSON.
/// </summary>
[AbpAuthorize(PermissionNames.Pages_Bots)]
public class BotAiKnowledgeAppService : ConversaStudioAppServiceBase, IBotAiKnowledgeAppService
{
    private const string GeminiProvider = "gemini";
    private const string DefaultGenerationModel = "gemini-2.5-flash";
    private const string DefaultEmbeddingModel = "gemini-embedding-001";
    private const int MaxKnowledgeTextLength = 24000;
    private const int ChunkSize = 1200;
    private const int ChunkOverlap = 200;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    private readonly IRepository<BotDefinition, Guid> _botDefinitionRepository;
    private readonly GeminiAiClient _geminiAiClient;
    private readonly IHttpClientFactory _httpClientFactory;

    public BotAiKnowledgeAppService(
        IRepository<BotDefinition, Guid> botDefinitionRepository,
        GeminiAiClient geminiAiClient,
        IHttpClientFactory httpClientFactory)
    {
        _botDefinitionRepository = botDefinitionRepository;
        _geminiAiClient = geminiAiClient;
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Returns the current bot-scoped AI settings and sources.
    /// </summary>
    [HttpGet]
    public async Task<BotAiKnowledgeDto> GetAsync(EntityDto<Guid> input)
    {
        var bot = await GetOwnedBotAsync(input.Id);
        return MapToDto(bot, DeserializeSnapshot(bot.AiKnowledgeJson));
    }

    /// <summary>
    /// Updates the bot-scoped provider settings.
    /// </summary>
    [HttpPost]
    public async Task<BotAiKnowledgeDto> UpsertSettingsAsync(UpsertBotAiSettingsRequest input)
    {
        var bot = await GetOwnedBotAsync(input.BotId);
        var encryptedApiKey = !string.IsNullOrWhiteSpace(input.ApiKey)
            ? SimpleStringCipher.Instance.Encrypt(input.ApiKey.Trim())
            : bot.AiApiKeyEncrypted;

        bot.UpdateAiSettings(
            GeminiProvider,
            encryptedApiKey,
            string.IsNullOrWhiteSpace(input.GenerationModel) ? DefaultGenerationModel : input.GenerationModel.Trim(),
            string.IsNullOrWhiteSpace(input.EmbeddingModel) ? DefaultEmbeddingModel : input.EmbeddingModel.Trim());

        await _botDefinitionRepository.UpdateAsync(bot);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDto(bot, DeserializeSnapshot(bot.AiKnowledgeJson));
    }

    /// <summary>
    /// Adds a pasted text knowledge source.
    /// </summary>
    [HttpPost]
    public async Task<BotAiKnowledgeDto> AddTextSourceAsync(AddBotAiTextSourceRequest input)
    {
        var bot = await GetOwnedBotAsync(input.BotId);
        var snapshot = DeserializeSnapshot(bot.AiKnowledgeJson);
        var source = CreateSource(BotAiKnowledgeSourceType.Text, ResolveSourceTitle(input.Title, "Pasted text"), string.Empty, string.Empty);
        snapshot.Sources.Add(source);

        await IngestSourceAsync(bot, source, NormalizeRawText(input.Text));

        bot.UpdateAiKnowledge(SerializeSnapshot(snapshot));
        await _botDefinitionRepository.UpdateAsync(bot);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDto(bot, snapshot);
    }

    /// <summary>
    /// Adds a single-page URL knowledge source.
    /// </summary>
    [HttpPost]
    public async Task<BotAiKnowledgeDto> AddUrlSourceAsync(AddBotAiUrlSourceRequest input)
    {
        var bot = await GetOwnedBotAsync(input.BotId);
        var snapshot = DeserializeSnapshot(bot.AiKnowledgeJson);
        var url = NormalizeUrl(input.Url);
        var source = CreateSource(BotAiKnowledgeSourceType.Url, ResolveSourceTitle(input.Title, url), url, string.Empty);
        snapshot.Sources.Add(source);

        var html = await FetchUrlAsync(url);
        var extractedText = await ExtractReadableHtmlTextAsync(html);
        await IngestSourceAsync(bot, source, extractedText);

        bot.UpdateAiKnowledge(SerializeSnapshot(snapshot));
        await _botDefinitionRepository.UpdateAsync(bot);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDto(bot, snapshot);
    }

    /// <summary>
    /// Adds a PDF knowledge source.
    /// </summary>
    [HttpPost]
    public async Task<BotAiKnowledgeDto> AddPdfSourceAsync(AddBotAiPdfSourceRequest input)
    {
        var bot = await GetOwnedBotAsync(input.BotId);
        var snapshot = DeserializeSnapshot(bot.AiKnowledgeJson);
        var source = CreateSource(BotAiKnowledgeSourceType.Pdf, ResolveSourceTitle(input.Title, input.FileName), string.Empty, input.FileName);
        snapshot.Sources.Add(source);

        var pdfBytes = Convert.FromBase64String(input.Base64Content?.Trim() ?? string.Empty);
        var extractedText = ExtractPdfText(pdfBytes);
        await IngestSourceAsync(bot, source, extractedText);

        bot.UpdateAiKnowledge(SerializeSnapshot(snapshot));
        await _botDefinitionRepository.UpdateAsync(bot);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDto(bot, snapshot);
    }

    /// <summary>
    /// Re-ingests an existing source.
    /// </summary>
    [HttpPost]
    public async Task<BotAiKnowledgeDto> ReingestSourceAsync(ManageBotAiSourceRequest input)
    {
        var bot = await GetOwnedBotAsync(input.BotId);
        var snapshot = DeserializeSnapshot(bot.AiKnowledgeJson);
        var source = snapshot.Sources.FirstOrDefault(candidate => candidate.Id == input.SourceId)
            ?? throw new UserFriendlyException("The requested AI knowledge source could not be found.");

        var refreshedText = source.SourceType switch
        {
            BotAiKnowledgeSourceType.Url => await ExtractReadableHtmlTextAsync(await FetchUrlAsync(source.SourceUrl)),
            _ => source.RawText
        };

        await IngestSourceAsync(bot, source, refreshedText);

        bot.UpdateAiKnowledge(SerializeSnapshot(snapshot));
        await _botDefinitionRepository.UpdateAsync(bot);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDto(bot, snapshot);
    }

    /// <summary>
    /// Deletes an existing source.
    /// </summary>
    [HttpPost]
    public async Task<BotAiKnowledgeDto> DeleteSourceAsync(ManageBotAiSourceRequest input)
    {
        var bot = await GetOwnedBotAsync(input.BotId);
        var snapshot = DeserializeSnapshot(bot.AiKnowledgeJson);
        snapshot.Sources = snapshot.Sources
            .Where(source => source.Id != input.SourceId)
            .ToList();

        bot.UpdateAiKnowledge(SerializeSnapshot(snapshot));
        await _botDefinitionRepository.UpdateAsync(bot);
        await CurrentUnitOfWork.SaveChangesAsync();

        return MapToDto(bot, snapshot);
    }

    private async Task<BotDefinition> GetOwnedBotAsync(Guid botId)
    {
        var currentUser = await GetCurrentUserAsync();
        var bot = await _botDefinitionRepository.FirstOrDefaultAsync(candidate =>
            candidate.Id == botId &&
            candidate.TenantId == AbpSession.TenantId &&
            candidate.OwnerUserId == currentUser.Id);

        if (bot == null)
        {
            throw new UserFriendlyException("The requested bot could not be found.");
        }

        if (string.IsNullOrWhiteSpace(bot.AiKnowledgeJson))
        {
            bot.UpdateAiKnowledge(SerializeSnapshot(new BotAiKnowledgeSnapshot()));
        }

        return bot;
    }

    private async Task IngestSourceAsync(BotDefinition bot, BotAiKnowledgeSource source, string rawText)
    {
        source.Status = BotAiKnowledgeSourceStatus.Processing;
        source.FailureReason = string.Empty;
        source.RawText = NormalizeRawText(rawText);
        source.LastIngestedAtUtc = DateTime.UtcNow;
        source.Chunks = [];

        try
        {
            var apiKey = ResolveApiKey(bot);
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new UserFriendlyException("Add your Gemini API key before ingesting knowledge.");
            }

            if (string.IsNullOrWhiteSpace(source.RawText))
            {
                throw new UserFriendlyException("The supplied source did not contain usable text.");
            }

            var chunks = BuildChunks(source.RawText);
            if (chunks.Count == 0)
            {
                throw new UserFriendlyException("The supplied source did not produce any indexable text chunks.");
            }

            using var cancellationSource = new CancellationTokenSource(TimeSpan.FromSeconds(45));
            for (var index = 0; index < chunks.Count; index += 1)
            {
                var embedding = await _geminiAiClient.EmbedAsync(
                    apiKey,
                    ResolveEmbeddingModel(bot),
                    chunks[index],
                    cancellationSource.Token);

                source.Chunks.Add(new BotAiKnowledgeChunk
                {
                    Index = index,
                    Content = chunks[index],
                    Embedding = embedding
                });
            }

            source.Status = BotAiKnowledgeSourceStatus.Ready;
            source.FailureReason = string.Empty;
        }
        catch (Exception exception)
        {
            source.Status = BotAiKnowledgeSourceStatus.Failed;
            source.FailureReason = exception.Message;
            source.Chunks = [];
        }
    }

    private static BotAiKnowledgeSource CreateSource(string sourceType, string title, string sourceUrl, string sourceFileName)
    {
        return new BotAiKnowledgeSource
        {
            Id = Guid.NewGuid(),
            SourceType = sourceType,
            Title = title,
            SourceUrl = sourceUrl,
            SourceFileName = sourceFileName,
            Status = BotAiKnowledgeSourceStatus.Processing
        };
    }

    private static string ResolveSourceTitle(string configuredTitle, string fallback)
    {
        var title = configuredTitle?.Trim();
        return string.IsNullOrWhiteSpace(title) ? fallback?.Trim() ?? "Knowledge source" : title;
    }

    private static string NormalizeUrl(string url)
    {
        var candidate = url?.Trim() ?? string.Empty;
        if (!Uri.TryCreate(candidate, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new UserFriendlyException("Please provide a valid http or https URL.");
        }

        return uri.ToString();
    }

    private async Task<string> FetchUrlAsync(string url)
    {
        var client = _httpClientFactory.CreateClient();
        using var cancellationSource = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        using var response = await client.GetAsync(url, cancellationSource.Token);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync(cancellationSource.Token);
    }

    private static async Task<string> ExtractReadableHtmlTextAsync(string html)
    {
        var parser = new HtmlParser();
        var document = await parser.ParseDocumentAsync(html ?? string.Empty);

        foreach (var script in document.QuerySelectorAll("script,style,noscript,svg"))
        {
            script.Remove();
        }

        var bodyText = document.Body?.TextContent ?? document.DocumentElement?.TextContent ?? string.Empty;
        return NormalizeRawText(bodyText);
    }

    private static string ExtractPdfText(byte[] pdfBytes)
    {
        using var stream = new MemoryStream(pdfBytes);
        using var document = PdfDocument.Open(stream);
        var builder = new StringBuilder();

        foreach (var page in document.GetPages())
        {
            builder.AppendLine(page.Text);
        }

        return NormalizeRawText(builder.ToString());
    }

    private static string NormalizeRawText(string text)
    {
        var normalized = Regex.Replace(text ?? string.Empty, "\\s+", " ").Trim();
        return normalized.Length > MaxKnowledgeTextLength
            ? normalized[..MaxKnowledgeTextLength]
            : normalized;
    }

    private static List<string> BuildChunks(string text)
    {
        var chunks = new List<string>();
        if (string.IsNullOrWhiteSpace(text))
        {
            return chunks;
        }

        var startIndex = 0;
        while (startIndex < text.Length)
        {
            var length = Math.Min(ChunkSize, text.Length - startIndex);
            var chunk = text.Substring(startIndex, length).Trim();
            if (!string.IsNullOrWhiteSpace(chunk))
            {
                chunks.Add(chunk);
            }

            if (startIndex + length >= text.Length)
            {
                break;
            }

            startIndex += ChunkSize - ChunkOverlap;
        }

        return chunks;
    }

    private static string ResolveApiKey(BotDefinition bot)
    {
        if (string.IsNullOrWhiteSpace(bot.AiApiKeyEncrypted))
        {
            return string.Empty;
        }

        return SimpleStringCipher.Instance.Decrypt(bot.AiApiKeyEncrypted);
    }

    private static string ResolveGenerationModel(BotDefinition bot)
    {
        return string.IsNullOrWhiteSpace(bot.AiGenerationModel) ? DefaultGenerationModel : bot.AiGenerationModel.Trim();
    }

    private static string ResolveEmbeddingModel(BotDefinition bot)
    {
        return string.IsNullOrWhiteSpace(bot.AiEmbeddingModel) ? DefaultEmbeddingModel : bot.AiEmbeddingModel.Trim();
    }

    private static BotAiKnowledgeSnapshot DeserializeSnapshot(string snapshotJson)
    {
        return JsonSerializer.Deserialize<BotAiKnowledgeSnapshot>(snapshotJson ?? string.Empty, JsonOptions)
               ?? new BotAiKnowledgeSnapshot();
    }

    private static string SerializeSnapshot(BotAiKnowledgeSnapshot snapshot)
    {
        return JsonSerializer.Serialize(snapshot ?? new BotAiKnowledgeSnapshot(), JsonOptions);
    }

    private static BotAiKnowledgeDto MapToDto(BotDefinition bot, BotAiKnowledgeSnapshot snapshot)
    {
        var readySourceCount = snapshot.Sources.Count(source =>
            string.Equals(source.Status, BotAiKnowledgeSourceStatus.Ready, StringComparison.OrdinalIgnoreCase) &&
            source.Chunks.Count > 0);

        return new BotAiKnowledgeDto
        {
            BotId = bot.Id,
            Provider = string.IsNullOrWhiteSpace(bot.AiProvider) ? GeminiProvider : bot.AiProvider,
            GenerationModel = ResolveGenerationModel(bot),
            EmbeddingModel = ResolveEmbeddingModel(bot),
            HasApiKey = !string.IsNullOrWhiteSpace(bot.AiApiKeyEncrypted),
            SourceCount = snapshot.Sources.Count,
            ReadySourceCount = readySourceCount,
            IsKnowledgeConfigured = !string.IsNullOrWhiteSpace(bot.AiApiKeyEncrypted) && readySourceCount > 0,
            Sources = snapshot.Sources
                .OrderByDescending(source => source.LastIngestedAtUtc)
                .Select(source => new BotAiKnowledgeSourceDto
                {
                    Id = source.Id,
                    SourceType = source.SourceType,
                    Title = source.Title,
                    Status = source.Status,
                    FailureReason = source.FailureReason,
                    SourceUrl = source.SourceUrl,
                    SourceFileName = source.SourceFileName,
                    LastIngestedAtUtc = source.LastIngestedAtUtc,
                    ChunkCount = source.Chunks.Count
                })
                .ToList()
        };
    }
}
