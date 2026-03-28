using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.UI;
using ConversaStudio.Domains.Bots;
using ConversaStudio.Domains.Deployments;
using ConversaStudio.Domains.Runtime;
using ConversaStudio.Domains.Transcripts;
using ConversaStudio.Services.Runtime.Dto;
using Microsoft.EntityFrameworkCore;

namespace ConversaStudio.Services.Runtime;

/// <summary>
/// Executes published bot graphs for anonymous widget conversations.
/// </summary>
public class WidgetRuntimeAppService : ConversaStudioAppServiceBase, IWidgetRuntimeAppService, ITransientDependency
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    private readonly IRepository<BotDeployment, Guid> _botDeploymentRepository;
    private readonly IRepository<BotDefinition, Guid> _botDefinitionRepository;
    private readonly IRepository<RuntimeSession, Guid> _runtimeSessionRepository;
    private readonly IRepository<TranscriptMessage, Guid> _transcriptMessageRepository;
    private readonly PublishedGraphRuntimeValidator _runtimeValidator;

    public WidgetRuntimeAppService(
        IRepository<BotDeployment, Guid> botDeploymentRepository,
        IRepository<BotDefinition, Guid> botDefinitionRepository,
        IRepository<RuntimeSession, Guid> runtimeSessionRepository,
        IRepository<TranscriptMessage, Guid> transcriptMessageRepository,
        PublishedGraphRuntimeValidator runtimeValidator)
    {
        _botDeploymentRepository = botDeploymentRepository;
        _botDefinitionRepository = botDefinitionRepository;
        _runtimeSessionRepository = runtimeSessionRepository;
        _transcriptMessageRepository = transcriptMessageRepository;
        _runtimeValidator = runtimeValidator;
    }

    /// <summary>
    /// Returns public bootstrap data for an active deployment.
    /// </summary>
    public async Task<WidgetBootstrapDto> GetBootstrapAsync(string deploymentKey, string embedOrigin)
    {
        var context = await GetDeploymentContextAsync(deploymentKey, embedOrigin, requireActive: true);

        return new WidgetBootstrapDto
        {
            DeploymentId = context.Deployment.Id,
            DeploymentKey = context.Deployment.DeploymentKey,
            BotName = context.Bot.Name,
            LauncherLabel = context.Deployment.LauncherLabel,
            ThemeColor = context.Deployment.ThemeColor,
            IsActive = true
        };
    }

    /// <summary>
    /// Creates or resumes a runtime session.
    /// </summary>
    public async Task<WidgetSessionResponseDto> StartSessionAsync(string deploymentKey, string embedOrigin, StartWidgetSessionRequest input)
    {
        var context = await GetDeploymentContextAsync(deploymentKey, embedOrigin, requireActive: true);
        var session = await ResolveSessionAsync(context, input.SessionId);

        if (!string.IsNullOrWhiteSpace(input.SessionId) && session != null)
        {
            var transcript = await GetSessionTranscriptAsync(session.Id);
            return new WidgetSessionResponseDto
            {
                SessionId = session.SessionToken,
                BotName = context.Bot.Name,
                AwaitingInput = session.AwaitingInput,
                IsCompleted = session.IsCompleted,
                Messages = transcript
            };
        }

        var createdSession = new RuntimeSession(
            Guid.NewGuid(),
            context.Deployment.TenantId,
            context.Deployment.Id,
            context.Bot.Id,
            context.Bot.PublishedVersion ?? 0,
            Guid.NewGuid().ToString("N"));

        var executionResult = ExecuteGraph(context.Graph, createdSession, null);
        createdSession.UpdateState(
            executionResult.CurrentNodeId,
            SerializeVariables(executionResult.Variables),
            executionResult.AwaitingInput,
            executionResult.PendingQuestionVariable,
            executionResult.IsCompleted);

        await _runtimeSessionRepository.InsertAsync(createdSession);
        await CurrentUnitOfWork.SaveChangesAsync();
        await PersistMessagesAsync(createdSession, executionResult.Messages);
        await CurrentUnitOfWork.SaveChangesAsync();

        return new WidgetSessionResponseDto
        {
            SessionId = createdSession.SessionToken,
            BotName = context.Bot.Name,
            AwaitingInput = createdSession.AwaitingInput,
            IsCompleted = createdSession.IsCompleted,
            Messages = ToDtoMessages(executionResult.Messages)
        };
    }

    /// <summary>
    /// Continues an existing runtime session with a user message.
    /// </summary>
    public async Task<WidgetSessionResponseDto> SendMessageAsync(string deploymentKey, string sessionId, string embedOrigin, SendWidgetMessageRequest input)
    {
        if (string.IsNullOrWhiteSpace(input.Message))
        {
            throw new UserFriendlyException("A message is required.");
        }

        var context = await GetDeploymentContextAsync(deploymentKey, embedOrigin, requireActive: true);
        var session = await ResolveSessionAsync(context, sessionId)
            ?? throw new UserFriendlyException("The requested session could not be found.");

        var executionResult = ExecuteGraph(context.Graph, session, input.Message.Trim());
        session.UpdateState(
            executionResult.CurrentNodeId,
            SerializeVariables(executionResult.Variables),
            executionResult.AwaitingInput,
            executionResult.PendingQuestionVariable,
            executionResult.IsCompleted);

        await _runtimeSessionRepository.UpdateAsync(session);
        await CurrentUnitOfWork.SaveChangesAsync();
        await PersistMessagesAsync(session, executionResult.Messages);
        await CurrentUnitOfWork.SaveChangesAsync();

        return new WidgetSessionResponseDto
        {
            SessionId = session.SessionToken,
            BotName = context.Bot.Name,
            AwaitingInput = session.AwaitingInput,
            IsCompleted = session.IsCompleted,
            Messages = ToDtoMessages(executionResult.Messages)
        };
    }

    private async Task<DeploymentContext> GetDeploymentContextAsync(string deploymentKey, string embedOrigin, bool requireActive)
    {
        var context = await (
            from deployment in _botDeploymentRepository.GetAll()
            join bot in _botDefinitionRepository.GetAll() on deployment.BotDefinitionId equals bot.Id
            where deployment.DeploymentKey == deploymentKey
            select new DeploymentContext
            {
                Deployment = deployment,
                Bot = bot
            }
        ).FirstOrDefaultAsync();

        if (context == null)
        {
            throw new UserFriendlyException("The requested deployment could not be found.");
        }

        ValidateAllowedDomain(context.Deployment, embedOrigin);

        if (requireActive && !string.Equals(context.Deployment.Status, BotDeploymentStatus.Active, StringComparison.OrdinalIgnoreCase))
        {
            throw new UserFriendlyException("This deployment is not active.");
        }

        if (!context.Bot.PublishedVersion.HasValue || string.IsNullOrWhiteSpace(context.Bot.PublishedGraphJson))
        {
            throw new UserFriendlyException("This deployment has no published bot snapshot.");
        }

        context.Graph = DeserializeGraph(context.Bot.PublishedGraphJson);
        var blockingIssues = _runtimeValidator.ValidateForLiveRuntime(context.Graph)
            .Where(issue => string.Equals(issue.Severity, BotValidationSeverity.Error, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (blockingIssues.Count > 0)
        {
            throw new UserFriendlyException(string.Join(" ", blockingIssues.Select(issue => issue.Message).Distinct()));
        }

        return context;
    }

    private async Task<RuntimeSession> ResolveSessionAsync(DeploymentContext context, string sessionId)
    {
        if (string.IsNullOrWhiteSpace(sessionId))
        {
            return null;
        }

        return await _runtimeSessionRepository.FirstOrDefaultAsync(session =>
            session.SessionToken == sessionId &&
            session.BotDeploymentId == context.Deployment.Id);
    }

    private async Task<List<WidgetChatMessageDto>> GetSessionTranscriptAsync(Guid runtimeSessionId)
    {
        var transcript = await _transcriptMessageRepository.GetAll()
            .Where(message => message.RuntimeSessionId == runtimeSessionId)
            .OrderBy(message => message.CreationTime)
            .ToListAsync();

        return transcript.Select(message => new WidgetChatMessageDto
        {
            Role = message.Role,
            Content = message.Content,
            CreatedAt = message.CreationTime
        }).ToList();
    }

    private async Task PersistMessagesAsync(RuntimeSession session, IReadOnlyList<RuntimeMessage> messages)
    {
        foreach (var message in messages)
        {
            await _transcriptMessageRepository.InsertAsync(new TranscriptMessage(
                Guid.NewGuid(),
                session.TenantId,
                session.BotDeploymentId,
                session.BotDefinitionId,
                session.Id,
                message.Role,
                message.Content));
        }
    }

    private static List<WidgetChatMessageDto> ToDtoMessages(IReadOnlyList<RuntimeMessage> messages)
    {
        return messages.Select(message => new WidgetChatMessageDto
        {
            Role = message.Role,
            Content = message.Content,
            CreatedAt = message.CreatedAt
        }).ToList();
    }

    private static ExecutionState ExecuteGraph(BotGraphDefinition graph, RuntimeSession session, string userInput)
    {
        var state = new ExecutionState
        {
            CurrentNodeId = session.CurrentNodeId,
            AwaitingInput = session.AwaitingInput,
            PendingQuestionVariable = session.PendingQuestionVariable,
            Variables = DeserializeVariables(session.VariablesJson)
        };

        if (string.IsNullOrWhiteSpace(state.CurrentNodeId))
        {
            state.CurrentNodeId = graph.Nodes.FirstOrDefault(node => IsNodeType(node, "start"))?.Id;
        }

        if (!string.IsNullOrWhiteSpace(userInput))
        {
            if (!state.AwaitingInput || string.IsNullOrWhiteSpace(state.PendingQuestionVariable))
            {
                throw new UserFriendlyException("This bot is not currently waiting for user input.");
            }

            state.Messages.Add(new RuntimeMessage("user", userInput));

            state.Variables[state.PendingQuestionVariable] = userInput;
            state.AwaitingInput = false;
            state.PendingQuestionVariable = string.Empty;
            state.CurrentNodeId = GetOutgoingTarget(graph, state.CurrentNodeId, null);
        }

        var safetyCounter = 0;

        while (!state.AwaitingInput && !state.IsCompleted && !string.IsNullOrWhiteSpace(state.CurrentNodeId) && safetyCounter < 64)
        {
            safetyCounter += 1;
            var currentNode = graph.Nodes.FirstOrDefault(node => node.Id == state.CurrentNodeId);

            if (currentNode == null)
            {
                state.IsCompleted = true;
                break;
            }

            if (IsNodeType(currentNode, "start"))
            {
                state.CurrentNodeId = GetOutgoingTarget(graph, currentNode.Id, null);
                continue;
            }

            if (IsNodeType(currentNode, "message"))
            {
                if (TryGetTrimmedString(currentNode.Config, "message", out var messageText) && !string.IsNullOrWhiteSpace(messageText))
                {
                    state.Messages.Add(new RuntimeMessage("bot", Interpolate(messageText, state.Variables)));
                }

                state.CurrentNodeId = GetOutgoingTarget(graph, currentNode.Id, null);
                continue;
            }

            if (IsNodeType(currentNode, "question"))
            {
                if (TryGetTrimmedString(currentNode.Config, "question", out var questionText) && !string.IsNullOrWhiteSpace(questionText))
                {
                    state.Messages.Add(new RuntimeMessage("bot", Interpolate(questionText, state.Variables)));
                }

                state.AwaitingInput = true;
                state.PendingQuestionVariable = TryGetTrimmedString(currentNode.Config, "variableName", out var variableName)
                    ? variableName
                    : string.Empty;
                break;
            }

            if (IsNodeType(currentNode, "condition"))
            {
                var nextHandle = ResolveConditionHandle(currentNode.Config, state.Variables);
                state.CurrentNodeId = GetOutgoingTarget(graph, currentNode.Id, nextHandle);

                if (string.IsNullOrWhiteSpace(state.CurrentNodeId))
                {
                    state.IsCompleted = true;
                }

                continue;
            }

            if (IsNodeType(currentNode, "variable"))
            {
                ApplyVariableNode(currentNode.Config, state.Variables);
                state.CurrentNodeId = GetOutgoingTarget(graph, currentNode.Id, null);
                continue;
            }

            if (IsNodeType(currentNode, "end"))
            {
                if (TryGetTrimmedString(currentNode.Config, "closingText", out var closingText) && !string.IsNullOrWhiteSpace(closingText))
                {
                    state.Messages.Add(new RuntimeMessage("bot", Interpolate(closingText, state.Variables)));
                }

                state.IsCompleted = true;
                state.CurrentNodeId = string.Empty;
                break;
            }

            throw new UserFriendlyException($"Unsupported runtime node type '{currentNode.Type}'.");
        }

        if (safetyCounter >= 64)
        {
            throw new UserFriendlyException("The runtime exceeded the safe execution limit for this graph.");
        }

        return state;
    }

    private static string ResolveConditionHandle(JsonElement config, IReadOnlyDictionary<string, string> variables)
    {
        var variableName = TryGetTrimmedString(config, "variableName", out var configuredVariable)
            ? configuredVariable
            : string.Empty;
        var variableValue = variables.TryGetValue(variableName, out var resolvedValue)
            ? resolvedValue ?? string.Empty
            : string.Empty;

        if (config.TryGetProperty("rules", out var rules) && rules.ValueKind == JsonValueKind.Array)
        {
            var index = 0;

            foreach (var rule in rules.EnumerateArray())
            {
                var operatorName = TryGetTrimmedString(rule, "operator", out var configuredOperator)
                    ? configuredOperator
                    : "equals";
                var ruleValue = TryGetTrimmedString(rule, "value", out var configuredValue)
                    ? configuredValue
                    : string.Empty;

                if (MatchesConditionRule(variableValue, ruleValue, operatorName))
                {
                    return $"rule-{index}";
                }

                index += 1;
            }
        }

        return "fallback";
    }

    private static bool MatchesConditionRule(string inputValue, string ruleValue, string operatorName)
    {
        var normalizedInput = (inputValue ?? string.Empty).Trim();
        var normalizedRuleValue = (ruleValue ?? string.Empty).Trim();

        switch (operatorName)
        {
            case "contains":
                return normalizedInput.IndexOf(normalizedRuleValue, StringComparison.OrdinalIgnoreCase) >= 0;
            case "startsWith":
                return normalizedInput.StartsWith(normalizedRuleValue, StringComparison.OrdinalIgnoreCase);
            case "endsWith":
                return normalizedInput.EndsWith(normalizedRuleValue, StringComparison.OrdinalIgnoreCase);
            case "isEmpty":
                return string.IsNullOrWhiteSpace(normalizedInput);
            case "isNotEmpty":
                return !string.IsNullOrWhiteSpace(normalizedInput);
            case "equals":
            default:
                return string.Equals(normalizedInput, normalizedRuleValue, StringComparison.OrdinalIgnoreCase);
        }
    }

    private static void ApplyVariableNode(JsonElement config, IDictionary<string, string> variables)
    {
        if (!TryGetTrimmedString(config, "variableName", out var variableName) || string.IsNullOrWhiteSpace(variableName))
        {
            return;
        }

        var operation = TryGetTrimmedString(config, "operation", out var configuredOperation)
            ? configuredOperation
            : "set";
        var value = TryGetTrimmedString(config, "value", out var configuredValue)
            ? Interpolate(configuredValue, new Dictionary<string, string>(variables))
            : string.Empty;

        switch (operation)
        {
            case "append":
                variables[variableName] = $"{(variables.TryGetValue(variableName, out var existingValue) ? existingValue : string.Empty)}{value}";
                return;
            case "clear":
                variables[variableName] = string.Empty;
                return;
            case "copy":
                var sourceVariableName = TryGetTrimmedString(config, "sourceVariableName", out var configuredSourceVariable)
                    ? configuredSourceVariable
                    : string.Empty;
                variables[variableName] = variables.TryGetValue(sourceVariableName, out var sourceValue) ? sourceValue : string.Empty;
                return;
            case "set":
            default:
                variables[variableName] = value;
                return;
        }
    }

    private static string GetOutgoingTarget(BotGraphDefinition graph, string sourceNodeId, string sourceHandle)
    {
        var matchingEdge = graph.Edges.FirstOrDefault(edge =>
            edge.Source == sourceNodeId &&
            string.Equals(edge.SourceHandle ?? string.Empty, sourceHandle ?? string.Empty, StringComparison.Ordinal));

        if (matchingEdge != null)
        {
            return matchingEdge.Target;
        }

        return graph.Edges.FirstOrDefault(edge => edge.Source == sourceNodeId)?.Target ?? string.Empty;
    }

    private static bool IsNodeType(BotNodeDefinition node, string expectedType)
    {
        return string.Equals(node.Type, expectedType, StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryGetTrimmedString(JsonElement element, string propertyName, out string value)
    {
        value = string.Empty;

        if (!element.TryGetProperty(propertyName, out var property) || property.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        value = property.GetString()?.Trim() ?? string.Empty;
        return true;
    }

    private static BotGraphDefinition DeserializeGraph(string graphJson)
    {
        return JsonSerializer.Deserialize<BotGraphDefinition>(graphJson, JsonOptions) ?? new BotGraphDefinition();
    }

    private static Dictionary<string, string> DeserializeVariables(string variablesJson)
    {
        var parsed = JsonSerializer.Deserialize<Dictionary<string, string>>(variablesJson, JsonOptions)
            ?? new Dictionary<string, string>();

        return new Dictionary<string, string>(parsed, StringComparer.OrdinalIgnoreCase);
    }

    private static string SerializeVariables(IReadOnlyDictionary<string, string> variables)
    {
        return JsonSerializer.Serialize(variables, JsonOptions);
    }

    private static string Interpolate(string template, IReadOnlyDictionary<string, string> variables)
    {
        return Regex.Replace(template ?? string.Empty, "\\{([a-zA-Z0-9_]+)\\}", match =>
        {
            var variableName = match.Groups[1].Value;
            return variables.TryGetValue(variableName, out var value) ? value ?? string.Empty : string.Empty;
        });
    }

    private static void ValidateAllowedDomain(BotDeployment deployment, string embedOrigin)
    {
        var allowedDomains = JsonSerializer.Deserialize<List<string>>(deployment.AllowedDomainsJson, JsonOptions) ?? [];
        var normalizedEmbedOrigin = DeploymentOriginNormalizer.Normalize(embedOrigin);

        if (allowedDomains.Count == 0)
        {
            throw new UserFriendlyException("This deployment has no allowed domains configured.");
        }

        if (string.IsNullOrWhiteSpace(normalizedEmbedOrigin))
        {
            throw new UserFriendlyException("This deployment request is missing an embed origin.");
        }

        if (!allowedDomains
            .Select(DeploymentOriginNormalizer.Normalize)
            .Where(domain => !string.IsNullOrWhiteSpace(domain))
            .Any(domain => string.Equals(domain, normalizedEmbedOrigin, StringComparison.OrdinalIgnoreCase)))
        {
            throw new UserFriendlyException("This origin is not allowed for the requested deployment.");
        }
    }

    private sealed class DeploymentContext
    {
        public BotDeployment Deployment { get; set; }

        public BotDefinition Bot { get; set; }

        public BotGraphDefinition Graph { get; set; }
    }

    private sealed class ExecutionState
    {
        public string CurrentNodeId { get; set; } = string.Empty;

        public bool AwaitingInput { get; set; }

        public string PendingQuestionVariable { get; set; } = string.Empty;

        public bool IsCompleted { get; set; }

        public Dictionary<string, string> Variables { get; set; } = new(StringComparer.OrdinalIgnoreCase);

        public List<RuntimeMessage> Messages { get; set; } = [];
    }

    private sealed class RuntimeMessage
    {
        public RuntimeMessage(string role, string content)
        {
            Role = role;
            Content = content;
            CreatedAt = DateTime.UtcNow;
        }

        public string Role { get; }

        public string Content { get; }

        public DateTime CreatedAt { get; }
    }
}
