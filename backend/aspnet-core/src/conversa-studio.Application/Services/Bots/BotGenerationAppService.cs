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
        try
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
            var firstAttemptGraph = await GenerateGraphAsync(input.ApiKey, BotGenerationPromptBuilder.BuildGenerationPrompt(input.Prompt, requestedName));
            var firstAttemptIssues = _botGraphValidator.Validate(firstAttemptGraph).ToList();
            var firstAttemptBlockingIssues = GetBlockingIssues(firstAttemptIssues);

            if (firstAttemptBlockingIssues.Count == 0)
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
            var repairedIssues = _botGraphValidator.Validate(repairedGraph).ToList();
            var repairedBlockingIssues = GetBlockingIssues(repairedIssues);

            if (repairedBlockingIssues.Count > 0)
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
        catch (UserFriendlyException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new UserFriendlyException(
                "We could not turn that prompt into a valid bot yet. Try a more specific prompt or check your Gemini API key and try again.");
        }
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

    private static List<BotValidationIssue> GetBlockingIssues(IEnumerable<BotValidationIssue> issues)
    {
        return issues
            .Where(issue => issue.Severity == BotValidationSeverity.Error)
            .ToList();
    }

    private static string BuildRepairPrompt(
        string originalPrompt,
        string requestedName,
        BotGraphDefinition invalidGraph,
        IReadOnlyList<BotValidationIssue> issues)
    {
        var sanitizedGraph = NormalizeGeneratedGraph(CloneGraph(invalidGraph));
        var serializedGraph = JsonSerializer.Serialize(BotGraphMapper.MapToDto(sanitizedGraph), BotGraphMapper.SerializerOptions);
        return BotGenerationPromptBuilder.BuildRepairPrompt(originalPrompt, requestedName, serializedGraph, issues);
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
            node.Config = NormalizeConfig(node.Type, node.Id, node.Config);
        }

        return graph;
    }

    private static BotGraphDefinition CloneGraph(BotGraphDefinition graph)
    {
        return new BotGraphDefinition
        {
            Metadata = new BotGraphMetadata
            {
                Id = graph.Metadata.Id,
                Name = graph.Metadata.Name,
                Status = graph.Metadata.Status,
                Version = graph.Metadata.Version,
                HandoffInboxes = graph.Metadata.HandoffInboxes
                    .Select(inbox => new BotHandoffInboxDefinition
                    {
                        Key = inbox.Key,
                        Label = inbox.Label,
                        Email = inbox.Email
                    })
                    .ToList()
            },
            Nodes = graph.Nodes
                .Select(node => new BotNodeDefinition
                {
                    Id = node.Id,
                    Type = node.Type,
                    Label = node.Label,
                    Position = new BotNodePosition
                    {
                        X = node.Position.X,
                        Y = node.Position.Y
                    },
                    Config = NormalizeConfig(node.Type, node.Id, node.Config)
                })
                .ToList(),
            Edges = graph.Edges
                .Select(edge => new BotEdgeDefinition
                {
                    Id = edge.Id,
                    Source = edge.Source,
                    Target = edge.Target,
                    SourceHandle = edge.SourceHandle,
                    Label = edge.Label
                })
                .ToList()
        };
    }

    private static JsonElement NormalizeConfig(string nodeType, string nodeId, JsonElement element)
    {
        var normalizedElement = NormalizeJsonElement(element);

        return nodeType switch
        {
            "start" => CreateJsonElement(new
            {
                kind = "start"
            }),
            "message" => CreateJsonElement(new
            {
                kind = "message",
                message = ReadString(normalizedElement, "message", "Hi there. How can I help today?")
            }),
            "question" => NormalizeQuestionConfig(nodeId, normalizedElement),
            "condition" => NormalizeConditionConfig(normalizedElement),
            "variable" => NormalizeVariableConfig(nodeId, normalizedElement),
            "api" => NormalizeApiConfig(normalizedElement),
            "ai" => NormalizeAiConfig(normalizedElement),
            "code" => NormalizeCodeConfig(normalizedElement),
            "handoff" => NormalizeHandoffConfig(normalizedElement),
            "end" => CreateJsonElement(new
            {
                kind = "end",
                closingText = ReadString(normalizedElement, "closingText", "Thanks for chatting with us.")
            }),
            _ => normalizedElement
        };
    }

    private static JsonElement NormalizeJsonElement(JsonElement element)
    {
        if (element.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
        {
            return CreateEmptyJsonObject();
        }

        return element.Clone();
    }

    private static JsonElement CreateEmptyJsonObject()
    {
        return JsonDocument.Parse("{}").RootElement.Clone();
    }

    private static JsonElement NormalizeQuestionConfig(string nodeId, JsonElement config)
    {
        var inputMode = ReadString(config, "inputMode", "text");
        var normalizedInputMode = string.Equals(inputMode, "choice", StringComparison.OrdinalIgnoreCase) ? "choice" : "text";

        return CreateJsonElement(new
        {
            kind = "question",
            question = ReadString(config, "question", "What can I help you with today?"),
            variableName = ReadString(config, "variableName", BuildVariableName(nodeId, "userInput")),
            inputMode = normalizedInputMode,
            options = NormalizeQuestionOptions(config, normalizedInputMode),
            invalidInputMessage = ReadString(config, "invalidInputMessage", "Please choose one of the available options.")
        });
    }

    private static JsonElement NormalizeConditionConfig(JsonElement config)
    {
        return CreateJsonElement(new
        {
            kind = "condition",
            variableName = ReadString(config, "variableName", "userIntent"),
            rules = NormalizeConditionRules(config),
            fallbackLabel = ReadString(config, "fallbackLabel", "Fallback")
        });
    }

    private static JsonElement NormalizeVariableConfig(string nodeId, JsonElement config)
    {
        var operation = ReadString(config, "operation", "set");
        var normalizedOperation = operation switch
        {
            "append" => "append",
            "clear" => "clear",
            "copy" => "copy",
            _ => "set"
        };

        return CreateJsonElement(new
        {
            kind = "variable",
            variableName = ReadString(config, "variableName", BuildVariableName(nodeId, "sessionValue")),
            operation = normalizedOperation,
            value = normalizedOperation == "clear" ? string.Empty : ReadString(config, "value", string.Empty),
            sourceVariableName = normalizedOperation == "copy"
                ? ReadString(config, "sourceVariableName", "userIntent")
                : ReadString(config, "sourceVariableName", string.Empty)
        });
    }

    private static JsonElement NormalizeApiConfig(JsonElement config)
    {
        var method = ReadString(config, "method", "GET");
        var normalizedMethod = string.Equals(method, "POST", StringComparison.OrdinalIgnoreCase) ? "POST" : "GET";

        return CreateJsonElement(new
        {
            kind = "api",
            endpoint = ReadString(config, "endpoint", "https://api.example.com/orders"),
            method = normalizedMethod,
            headers = NormalizeApiHeaders(config),
            body = ReadString(config, "body", string.Empty),
            timeoutMs = ReadPositiveInt(config, "timeoutMs", 10000),
            responseMappings = NormalizeApiMappings(config),
            successLabel = ReadString(config, "successLabel", "Success"),
            errorLabel = ReadString(config, "errorLabel", "Error")
        });
    }

    private static JsonElement NormalizeAiConfig(JsonElement config)
    {
        var responseMode = ReadString(config, "responseMode", "strict");
        var normalizedResponseMode = responseMode switch
        {
            "hybrid" => "hybrid",
            "free" => "free",
            _ => "strict"
        };

        return CreateJsonElement(new
        {
            kind = "ai",
            instructions = ReadString(config, "instructions", "Answer the question using the attached knowledge base."),
            fallbackText = ReadString(config, "fallbackText", "I'm not confident enough to answer that yet."),
            responseMode = normalizedResponseMode
        });
    }

    private static JsonElement NormalizeCodeConfig(JsonElement config)
    {
        return CreateJsonElement(new
        {
            kind = "code",
            script = ReadString(config, "script", "vars.result = vars.userIntent ?? \"\";"),
            timeoutMs = ReadPositiveInt(config, "timeoutMs", 1000)
        });
    }

    private static JsonElement NormalizeHandoffConfig(JsonElement config)
    {
        var inboxKey = ReadString(config, "inboxKey", ReadString(config, "queueName", "support"));

        return CreateJsonElement(new
        {
            kind = "handoff",
            inboxKey,
            confirmationMessage = ReadString(config, "confirmationMessage", "Thanks. Our team will review your message and follow up by email."),
            contactEmailVariable = ReadString(config, "contactEmailVariable", "email"),
            queueName = string.IsNullOrWhiteSpace(ReadString(config, "queueName", string.Empty))
                ? null
                : ReadString(config, "queueName", string.Empty)
        });
    }

    private static List<object> NormalizeQuestionOptions(JsonElement config, string inputMode)
    {
        if (!string.Equals(inputMode, "choice", StringComparison.OrdinalIgnoreCase))
        {
            return [];
        }

        var options = new List<object>();

        if (!config.TryGetProperty("options", out var rawOptions) || rawOptions.ValueKind != JsonValueKind.Array)
        {
            return options;
        }

        var optionIndex = 0;
        foreach (var option in rawOptions.EnumerateArray())
        {
            if (option.ValueKind == JsonValueKind.String)
            {
                var optionLabel = option.GetString()?.Trim() ?? string.Empty;
                if (string.IsNullOrWhiteSpace(optionLabel))
                {
                    optionIndex += 1;
                    continue;
                }

                options.Add(new
                {
                    id = $"option-{optionIndex + 1}",
                    label = optionLabel,
                    value = optionLabel
                });
                optionIndex += 1;
                continue;
            }

            var label = ReadString(option, "label", string.Empty);
            if (string.IsNullOrWhiteSpace(label))
            {
                optionIndex += 1;
                continue;
            }

            options.Add(new
            {
                id = ReadString(option, "id", $"option-{optionIndex + 1}"),
                label,
                value = ReadString(option, "value", label)
            });
            optionIndex += 1;
        }

        return options;
    }

    private static List<object> NormalizeConditionRules(JsonElement config)
    {
        var rules = new List<object>();

        if (config.TryGetProperty("rules", out var rawRules) && rawRules.ValueKind == JsonValueKind.Array)
        {
            var ruleIndex = 0;
            foreach (var rule in rawRules.EnumerateArray())
            {
                var normalizedOperator = ReadString(rule, "operator", "equals");
                normalizedOperator = normalizedOperator switch
                {
                    "contains" => "contains",
                    "startsWith" => "startsWith",
                    "endsWith" => "endsWith",
                    "isEmpty" => "isEmpty",
                    "isNotEmpty" => "isNotEmpty",
                    _ => "equals"
                };

                rules.Add(new
                {
                    id = ReadString(rule, "id", $"condition-rule-{ruleIndex + 1}"),
                    @operator = normalizedOperator,
                    value = ReadString(rule, "value", normalizedOperator is "isEmpty" or "isNotEmpty" ? string.Empty : "value")
                });
                ruleIndex += 1;
            }
        }

        return rules;
    }

    private static List<object> NormalizeApiHeaders(JsonElement config)
    {
        var headers = new List<object>();

        if (config.TryGetProperty("headers", out var rawHeaders) && rawHeaders.ValueKind == JsonValueKind.Array)
        {
            var headerIndex = 0;
            foreach (var header in rawHeaders.EnumerateArray())
            {
                headers.Add(new
                {
                    id = ReadString(header, "id", $"header-{headerIndex + 1}"),
                    key = ReadString(header, "key", string.Empty),
                    value = ReadString(header, "value", string.Empty)
                });
                headerIndex += 1;
            }
        }

        return headers;
    }

    private static List<object> NormalizeApiMappings(JsonElement config)
    {
        var mappings = new List<object>();

        if (config.TryGetProperty("responseMappings", out var rawMappings) && rawMappings.ValueKind == JsonValueKind.Array)
        {
            var mappingIndex = 0;
            foreach (var mapping in rawMappings.EnumerateArray())
            {
                mappings.Add(new
                {
                    id = ReadString(mapping, "id", $"mapping-{mappingIndex + 1}"),
                    variableName = ReadString(mapping, "variableName", "apiResult"),
                    path = ReadString(mapping, "path", "body")
                });
                mappingIndex += 1;
            }
        }

        return mappings;
    }

    private static string ReadString(JsonElement element, string propertyName, string fallback)
    {
        if (!element.TryGetProperty(propertyName, out var property))
        {
            return fallback;
        }

        return property.ValueKind switch
        {
            JsonValueKind.String => string.IsNullOrWhiteSpace(property.GetString()) ? fallback : property.GetString()!.Trim(),
            JsonValueKind.Number => property.ToString(),
            JsonValueKind.True => bool.TrueString.ToLowerInvariant(),
            JsonValueKind.False => bool.FalseString.ToLowerInvariant(),
            _ => fallback
        };
    }

    private static int ReadPositiveInt(JsonElement element, string propertyName, int fallback)
    {
        if (element.TryGetProperty(propertyName, out var property) &&
            property.ValueKind == JsonValueKind.Number &&
            property.TryGetInt32(out var value) &&
            value > 0)
        {
            return value;
        }

        return fallback;
    }

    private static JsonElement CreateJsonElement<T>(T value)
    {
        return JsonSerializer.SerializeToElement(value, BotGraphMapper.SerializerOptions);
    }

    private static string BuildVariableName(string nodeId, string fallbackPrefix)
    {
        var normalizedNodeId = (nodeId ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalizedNodeId))
        {
            return fallbackPrefix;
        }

        var cleanedNodeId = normalizedNodeId
            .Replace("question-", string.Empty, StringComparison.Ordinal)
            .Replace("variable-", string.Empty, StringComparison.Ordinal)
            .Replace("node-", string.Empty, StringComparison.Ordinal)
            .Replace("-", string.Empty, StringComparison.Ordinal);

        return string.IsNullOrWhiteSpace(cleanedNodeId) ? fallbackPrefix : $"{fallbackPrefix}{cleanedNodeId}";
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
            "api" => "API Call",
            "ai" => "AI Node",
            "code" => "Code",
            "variable" => "Variable",
            "handoff" => "Handoff",
            "end" => "End",
            _ => "Node"
        };
    }
}
