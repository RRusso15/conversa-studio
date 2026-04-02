using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Abp.Authorization;
using Abp.UI;
using ConversaStudio.Authorization;
using ConversaStudio.Domains.Bots;
using ConversaStudio.Services.AiKnowledge;
using ConversaStudio.Services.Bots.Dto;
using Microsoft.AspNetCore.Mvc;

namespace ConversaStudio.Services.Bots;

/// <summary>
/// Uses Gemini to generate builder-safe starter graphs from a natural-language prompt.
/// </summary>
[AbpAuthorize(PermissionNames.Pages_Bots)]
public class BotGenerationAppService : ConversaStudioAppServiceBase, IBotGenerationAppService
{
    private const string GenerationModel = "gemini-2.5-flash";

    private readonly GeminiAiClient _geminiAiClient;
    private readonly BotGraphValidator _botGraphValidator;

    public BotGenerationAppService(GeminiAiClient geminiAiClient, BotGraphValidator botGraphValidator)
    {
        _geminiAiClient = geminiAiClient;
        _botGraphValidator = botGraphValidator;
    }

    /// <summary>
    /// Generates a validated bot graph from a natural-language prompt.
    /// </summary>
    [HttpPost]
    public async Task<GeneratedBotGraphDto> GenerateFromPrompt(GenerateBotGraphFromPromptRequest input)
    {
        await GetCurrentUserAsync();

        if (string.IsNullOrWhiteSpace(input.ApiKey))
        {
            throw new UserFriendlyException("Add your Gemini API key to generate a bot from a prompt.");
        }

        if (string.IsNullOrWhiteSpace(input.Prompt))
        {
            throw new UserFriendlyException("Describe the bot you want to create.");
        }

        var requestedName = string.IsNullOrWhiteSpace(input.BotName) ? "Generated Bot" : input.BotName.Trim();
        var firstAttemptGraph = await GenerateGraphAsync(input.ApiKey, BuildGenerationPrompt(input.Prompt, requestedName));
        var firstAttemptIssues = GetBlockingIssues(firstAttemptGraph);

        if (firstAttemptIssues.Count == 0)
        {
            return new GeneratedBotGraphDto
            {
                Graph = BotGraphMapper.MapToDto(firstAttemptGraph),
                Model = GenerationModel
            };
        }

        var repairedGraph = await GenerateGraphAsync(
            input.ApiKey,
            BuildRepairPrompt(input.Prompt, requestedName, firstAttemptGraph, firstAttemptIssues));
        var repairedIssues = GetBlockingIssues(repairedGraph);

        if (repairedIssues.Count > 0)
        {
            throw new UserFriendlyException(
                "The generated bot could not be made valid yet. Try a simpler prompt or be more specific about the flow you want.");
        }

        return new GeneratedBotGraphDto
        {
            Graph = BotGraphMapper.MapToDto(repairedGraph),
            Model = GenerationModel,
            Notes =
            [
                "The first draft was repaired automatically to match the builder graph rules."
            ]
        };
    }

    private async Task<BotGraphDefinition> GenerateGraphAsync(string apiKey, string prompt)
    {
        var rawResponse = await _geminiAiClient.GenerateAsync(apiKey.Trim(), GenerationModel, prompt, CancellationToken.None);
        var jsonPayload = ExtractJsonPayload(rawResponse);
        var graphDto = JsonSerializer.Deserialize<BotGraphDto>(jsonPayload, BotGraphMapper.SerializerOptions);

        if (graphDto == null)
        {
            throw new UserFriendlyException("The AI response could not be parsed into a bot graph.");
        }

        return NormalizeGeneratedGraph(BotGraphMapper.MapToDomainGraph(graphDto));
    }

    private List<BotValidationIssue> GetBlockingIssues(BotGraphDefinition graph)
    {
        return _botGraphValidator.Validate(graph)
            .Where(issue => issue.Severity == BotValidationSeverity.Error)
            .ToList();
    }

    private static string BuildGenerationPrompt(string userPrompt, string requestedName)
    {
        return $@"You generate JSON for a visual chatbot builder.

Return JSON only. Do not wrap it in markdown. Do not explain anything.

Create a valid BotGraph object with this exact top-level shape:
{{
  ""metadata"": {{
    ""id"": ""generated-bot"",
    ""name"": ""{requestedName}"",
    ""status"": ""draft"",
    ""version"": ""v1"",
    ""handoffInboxes"": []
  }},
  ""nodes"": [],
  ""edges"": []
}}

Use only these node types:
- start
- message
- question
- condition
- variable
- handoff
- end

Rules:
- Include exactly 1 start node.
- Every node must have a unique id.
- Every non-start node should be reachable from the start node.
- Include at least 1 end node unless a handoff node is the intended terminal step.
- Keep the graph simple and practical.
- Prefer start -> message -> question/message -> end patterns unless branching is clearly needed.
- For question nodes, always include:
  {{
    ""kind"": ""question"",
    ""question"": ""..."",
    ""variableName"": ""camelCaseName"",
    ""inputMode"": ""text"",
    ""options"": [],
    ""invalidInputMessage"": ""...""
  }}
- For condition nodes:
  - use config.rules as an array
  - each rule must have id, operator, value
  - use edge sourceHandle values ""rule-0"", ""rule-1"", etc for rule branches
  - use edge sourceHandle ""fallback"" for the fallback branch when present
- For handoff nodes:
  - only use if the prompt clearly asks for human escalation
  - config must include kind, inboxKey, confirmationMessage, contactEmailVariable
  - if you use handoff, add metadata.handoffInboxes with at least one inbox:
    {{
      ""key"": ""support"",
      ""label"": ""Support Team"",
      ""email"": ""support@example.com""
    }}
  - make sure contactEmailVariable matches a variable captured by a prior question node
- Use realistic message text.
- Position nodes with increasing y values so the graph is readable.

User request:
{userPrompt}";
    }

    private static string BuildRepairPrompt(
        string originalPrompt,
        string requestedName,
        BotGraphDefinition invalidGraph,
        IReadOnlyList<BotValidationIssue> issues)
    {
        var serializedGraph = JsonSerializer.Serialize(BotGraphMapper.MapToDto(invalidGraph), BotGraphMapper.SerializerOptions);
        var issueText = string.Join(Environment.NewLine, issues.Select(issue => $"- {issue.Message}"));

        return $@"Repair this bot graph JSON so it becomes valid for the builder.

Return JSON only.

Original user request:
{originalPrompt}

Desired bot name:
{requestedName}

Validation errors:
{issueText}

Current invalid JSON:
{serializedGraph}

Keep the same overall intent, but fix the structure so it becomes a valid BotGraph.";
    }

    private static BotGraphDefinition NormalizeGeneratedGraph(BotGraphDefinition graph)
    {
        graph.Metadata.Id = "generated-bot";
        graph.Metadata.Name = string.IsNullOrWhiteSpace(graph.Metadata.Name) ? "Generated Bot" : graph.Metadata.Name.Trim();
        graph.Metadata.Status = "draft";
        graph.Metadata.Version = "v1";
        graph.Metadata.HandoffInboxes ??= [];
        graph.Nodes ??= [];
        graph.Edges ??= [];

        foreach (var node in graph.Nodes)
        {
            node.Type = (node.Type ?? string.Empty).Trim().ToLowerInvariant();
            node.Label = string.IsNullOrWhiteSpace(node.Label) ? ResolveDefaultLabel(node.Type) : node.Label.Trim();
        }

        return graph;
    }

    private static string ExtractJsonPayload(string rawResponse)
    {
        var trimmed = rawResponse?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            throw new UserFriendlyException("The AI response was empty.");
        }

        var fencedMatch = Regex.Match(trimmed, "```(?:json)?\\s*(\\{[\\s\\S]*\\})\\s*```", RegexOptions.IgnoreCase);
        if (fencedMatch.Success)
        {
            return fencedMatch.Groups[1].Value;
        }

        var firstBraceIndex = trimmed.IndexOf('{');
        var lastBraceIndex = trimmed.LastIndexOf('}');

        if (firstBraceIndex < 0 || lastBraceIndex <= firstBraceIndex)
        {
            throw new UserFriendlyException("The AI response did not contain JSON.");
        }

        return trimmed[firstBraceIndex..(lastBraceIndex + 1)];
    }

    private static string ResolveDefaultLabel(string nodeType)
    {
        return nodeType switch
        {
            "start" => "Start",
            "message" => "Message",
            "question" => "Question",
            "condition" => "Condition",
            "variable" => "Variable",
            "handoff" => "Handoff",
            "end" => "End",
            _ => "Node"
        };
    }
}
