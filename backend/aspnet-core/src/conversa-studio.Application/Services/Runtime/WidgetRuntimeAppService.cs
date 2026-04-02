using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.Runtime.Security;
using Abp.UI;
using ConversaStudio.Domains.AiKnowledge;
using ConversaStudio.Domains.Bots;
using ConversaStudio.Domains.Deployments;
using ConversaStudio.Domains.Runtime;
using ConversaStudio.Services.AiKnowledge;
using ConversaStudio.Domains.Transcripts;
using ConversaStudio.Services.Runtime.Dto;
using Microsoft.Extensions.DependencyInjection;
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
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly RestrictedJavaScriptExecutor _restrictedJavaScriptExecutor;
    private readonly GeminiAiClient _geminiAiClient;

    public WidgetRuntimeAppService(
        IRepository<BotDeployment, Guid> botDeploymentRepository,
        IRepository<BotDefinition, Guid> botDefinitionRepository,
        IRepository<RuntimeSession, Guid> runtimeSessionRepository,
        IRepository<TranscriptMessage, Guid> transcriptMessageRepository,
        PublishedGraphRuntimeValidator runtimeValidator,
        IHttpClientFactory httpClientFactory,
        RestrictedJavaScriptExecutor restrictedJavaScriptExecutor,
        GeminiAiClient geminiAiClient)
    {
        _botDeploymentRepository = botDeploymentRepository;
        _botDefinitionRepository = botDefinitionRepository;
        _runtimeSessionRepository = runtimeSessionRepository;
        _transcriptMessageRepository = transcriptMessageRepository;
        _runtimeValidator = runtimeValidator;
        _httpClientFactory = httpClientFactory;
        _restrictedJavaScriptExecutor = restrictedJavaScriptExecutor;
        _geminiAiClient = geminiAiClient;
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
            return CreateSessionResponse(context.Graph, session, context.Bot.Name, transcript, null);
        }

        var createdSession = new RuntimeSession(
            Guid.NewGuid(),
            context.Deployment.TenantId,
            context.Deployment.Id,
            context.Bot.Id,
            context.Bot.PublishedVersion ?? 0,
            Guid.NewGuid().ToString("N"));

        var executionResult = await ExecuteGraphAsync(context.Graph, context.Bot, createdSession, null);
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

        return CreateSessionResponse(context.Graph, createdSession, context.Bot.Name, ToDtoMessages(executionResult.Messages), executionResult.Handoff);
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

        var executionResult = await ExecuteGraphAsync(context.Graph, context.Bot, session, input.Message.Trim());
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

        return CreateSessionResponse(context.Graph, session, context.Bot.Name, ToDtoMessages(executionResult.Messages), executionResult.Handoff);
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

        var aiReadinessIssues = BuildAiRuntimeIssues(context.Bot, context.Graph);
        if (aiReadinessIssues.Count > 0)
        {
            throw new UserFriendlyException(string.Join(" ", aiReadinessIssues.Select(issue => issue.Message).Distinct()));
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

    private static WidgetSessionResponseDto CreateSessionResponse(
        BotGraphDefinition graph,
        RuntimeSession session,
        string botName,
        List<WidgetChatMessageDto> messages,
        WidgetHandoffDto handoff)
    {
        return new WidgetSessionResponseDto
        {
            SessionId = session.SessionToken,
            BotName = botName,
            Messages = messages,
            AwaitingInput = session.AwaitingInput,
            AwaitingInputMode = ResolveAwaitingInputMode(graph, session),
            SuggestedReplies = ResolveSuggestedReplies(graph, session),
            IsCompleted = session.IsCompleted,
            Handoff = handoff
        };
    }

    private async Task<ExecutionState> ExecuteGraphAsync(BotGraphDefinition graph, BotDefinition bot, RuntimeSession session, string userInput)
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
            if (TryResolveQuestionChoice(graph, state.CurrentNodeId, userInput, out var resolvedChoice))
            {
                state.Variables[state.PendingQuestionVariable] = resolvedChoice.StoredValue;
                state.AwaitingInput = false;
                state.PendingQuestionVariable = string.Empty;
                state.CurrentNodeId = GetOutgoingTarget(graph, state.CurrentNodeId, resolvedChoice.HandleId);
            }
            else if (IsChoiceQuestion(graph, state.CurrentNodeId))
            {
                state.Messages.Add(new RuntimeMessage("bot", GetInvalidQuestionInputMessage(graph, state.CurrentNodeId)));
                return state;
            }
            else
            {
                state.Variables[state.PendingQuestionVariable] = userInput;
                state.AwaitingInput = false;
                state.PendingQuestionVariable = string.Empty;
                state.CurrentNodeId = GetOutgoingTarget(graph, state.CurrentNodeId, null);
            }
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

            if (IsNodeType(currentNode, "api"))
            {
                var nextHandle = await ExecuteApiNodeAsync(currentNode.Config, state.Variables);
                state.CurrentNodeId = GetOutgoingTarget(graph, currentNode.Id, nextHandle);

                if (string.IsNullOrWhiteSpace(state.CurrentNodeId))
                {
                    state.IsCompleted = true;
                }

                continue;
            }

            if (IsNodeType(currentNode, "ai"))
            {
                var latestUserMessage = state.Messages
                    .LastOrDefault(message => string.Equals(message.Role, "user", StringComparison.OrdinalIgnoreCase))
                    ?.Content ?? string.Empty;
                var aiResponse = await ExecuteAiNodeAsync(currentNode.Config, bot, state.Variables, latestUserMessage);

                if (!string.IsNullOrWhiteSpace(aiResponse))
                {
                    state.Messages.Add(new RuntimeMessage("bot", aiResponse));
                }

                state.CurrentNodeId = GetOutgoingTarget(graph, currentNode.Id, null);

                if (string.IsNullOrWhiteSpace(state.CurrentNodeId))
                {
                    state.IsCompleted = true;
                }

                continue;
            }

            if (IsNodeType(currentNode, "code"))
            {
                var nextHandle = await ExecuteCodeNodeAsync(currentNode.Config, state.Variables);
                state.CurrentNodeId = GetOutgoingTarget(graph, currentNode.Id, nextHandle);

                if (string.IsNullOrWhiteSpace(state.CurrentNodeId))
                {
                    state.IsCompleted = true;
                }

                continue;
            }

            if (IsNodeType(currentNode, "handoff"))
            {
                var resolvedHandoff = ResolveHandoff(graph, currentNode, state.Variables);

                if (resolvedHandoff.Handoff == null)
                {
                    state.Messages.Add(new RuntimeMessage("bot", resolvedHandoff.FailureMessage));
                    state.IsCompleted = true;
                    state.CurrentNodeId = string.Empty;
                    state.AwaitingInput = false;
                    state.PendingQuestionVariable = string.Empty;
                    break;
                }

                if (!string.IsNullOrWhiteSpace(resolvedHandoff.ConfirmationMessage))
                {
                    state.Messages.Add(new RuntimeMessage("bot", resolvedHandoff.ConfirmationMessage));
                }

                state.Handoff = resolvedHandoff.Handoff;
                state.IsCompleted = true;
                state.CurrentNodeId = string.Empty;
                state.AwaitingInput = false;
                state.PendingQuestionVariable = string.Empty;
                break;
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

    private static ResolvedHandoff ResolveHandoff(
        BotGraphDefinition graph,
        BotNodeDefinition currentNode,
        IReadOnlyDictionary<string, string> variables)
    {
        var inboxKey = TryGetTrimmedString(currentNode.Config, "inboxKey", out var configuredInboxKey)
            ? configuredInboxKey
            : TryGetTrimmedString(currentNode.Config, "queueName", out var legacyQueueName)
                ? legacyQueueName
                : string.Empty;
        var confirmationMessage = TryGetTrimmedString(currentNode.Config, "confirmationMessage", out var configuredConfirmationMessage)
            ? Interpolate(configuredConfirmationMessage, variables)
            : "Thanks. Our team will review your message and follow up by email.";
        var contactEmailVariable = TryGetTrimmedString(currentNode.Config, "contactEmailVariable", out var configuredContactVariable)
            ? configuredContactVariable
            : string.Empty;
        var inbox = graph.Metadata.HandoffInboxes.FirstOrDefault(candidate =>
            string.Equals(candidate.Key?.Trim(), inboxKey, StringComparison.OrdinalIgnoreCase));

        if (string.IsNullOrWhiteSpace(inboxKey) || inbox == null || string.IsNullOrWhiteSpace(inbox.Email))
        {
            return new ResolvedHandoff(null, confirmationMessage, "We could not route your request right now. Please try again later.");
        }

        if (string.IsNullOrWhiteSpace(contactEmailVariable) ||
            !variables.TryGetValue(contactEmailVariable, out var contactEmail) ||
            !IsValidEmail(contactEmail))
        {
            return new ResolvedHandoff(null, confirmationMessage, "We need a valid email address before we can hand this conversation to the team.");
        }

        return new ResolvedHandoff(
            new WidgetHandoffDto
            {
                NodeId = currentNode.Id,
                InboxKey = inbox.Key?.Trim() ?? string.Empty,
                InboxLabel = string.IsNullOrWhiteSpace(inbox.Label) ? inbox.Key?.Trim() ?? string.Empty : inbox.Label.Trim(),
                RecipientEmail = inbox.Email.Trim(),
                ContactEmail = contactEmail.Trim(),
                Variables = new Dictionary<string, string>(variables, StringComparer.OrdinalIgnoreCase)
            },
            confirmationMessage,
            string.Empty);
    }

    private async Task<string> ExecuteAiNodeAsync(
        JsonElement config,
        BotDefinition bot,
        IDictionary<string, string> variables,
        string latestUserMessage)
    {
        var fallbackText = TryGetTrimmedString(config, "fallbackText", out var configuredFallbackText)
            ? Interpolate(configuredFallbackText, new Dictionary<string, string>(variables))
            : "I’m not confident enough to answer that yet.";
        var instructions = TryGetTrimmedString(config, "instructions", out var configuredInstructions)
            ? Interpolate(configuredInstructions, new Dictionary<string, string>(variables))
            : string.Empty;
        var responseMode = TryGetTrimmedString(config, "responseMode", out var configuredResponseMode)
            ? configuredResponseMode
            : "strict";

        try
        {
            var knowledge = DeserializeAiKnowledge(bot.AiKnowledgeJson);
            var readyChunks = knowledge.Sources
                .Where(source => string.Equals(source.Status, BotAiKnowledgeSourceStatus.Ready, StringComparison.OrdinalIgnoreCase))
                .SelectMany(source => source.Chunks)
                .Where(chunk => chunk.Embedding.Count > 0 && !string.IsNullOrWhiteSpace(chunk.Content))
                .ToList();
            var apiKey = ResolveAiApiKey(bot);

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return fallbackText;
            }

            using var cancellationSource = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(30));
            List<string> relevantChunks = [];

            if (readyChunks.Count > 0)
            {
                var queryText = $"{instructions}\n\n{latestUserMessage}".Trim();
                var queryEmbedding = await _geminiAiClient.EmbedAsync(
                    apiKey,
                    ResolveAiEmbeddingModel(bot),
                    string.IsNullOrWhiteSpace(queryText) ? instructions : queryText,
                    cancellationSource.Token);

                relevantChunks = readyChunks
                    .Select(chunk => new
                    {
                        chunk.Content,
                        Score = CosineSimilarity(queryEmbedding, chunk.Embedding)
                    })
                    .OrderByDescending(item => item.Score)
                    .Take(5)
                    .Where(item => item.Score > 0)
                    .Select(item => item.Content)
                    .ToList();
            }

            if (string.Equals(responseMode, "strict", StringComparison.OrdinalIgnoreCase) && relevantChunks.Count == 0)
            {
                return fallbackText;
            }

            var prompt = BuildAiPrompt(instructions, latestUserMessage, relevantChunks, responseMode, fallbackText);
            var response = await _geminiAiClient.GenerateAsync(
                apiKey,
                ResolveAiGenerationModel(bot),
                prompt,
                cancellationSource.Token);

            return string.IsNullOrWhiteSpace(response) ? fallbackText : response.Trim();
        }
        catch (Exception exception)
        {
            Logger.Warn($"AI node execution failed: {exception.Message}", exception);
            return fallbackText;
        }
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

    private async Task<string> ExecuteCodeNodeAsync(JsonElement config, IDictionary<string, string> variables)
    {
        var script = ResolveCodeScript(config);
        if (string.IsNullOrWhiteSpace(script))
        {
            return "error";
        }

        var timeoutMs = config.TryGetProperty("timeoutMs", out var timeoutElement) &&
                        timeoutElement.ValueKind == JsonValueKind.Number &&
                        timeoutElement.TryGetInt32(out var configuredTimeout)
            ? configuredTimeout
            : 1000;

        try
        {
            var nextVariables = await Task.Run(() =>
                _restrictedJavaScriptExecutor.Execute(
                    script,
                    new Dictionary<string, string>(variables, StringComparer.OrdinalIgnoreCase),
                    timeoutMs));

            variables.Clear();

            foreach (var pair in nextVariables)
            {
                variables[pair.Key] = pair.Value ?? string.Empty;
            }

            return "success";
        }
        catch (Exception exception)
        {
            Logger.Warn($"Code node execution failed: {exception.Message}", exception);
            return "error";
        }
    }

    private async Task<string> ExecuteApiNodeAsync(JsonElement config, IDictionary<string, string> variables)
    {
        var client = _httpClientFactory.CreateClient();
        var method = TryGetTrimmedString(config, "method", out var configuredMethod)
            ? configuredMethod.ToUpperInvariant()
            : "GET";
        var endpoint = TryGetTrimmedString(config, "endpoint", out var configuredEndpoint)
            ? Interpolate(configuredEndpoint, new Dictionary<string, string>(variables))
            : string.Empty;

        if (string.IsNullOrWhiteSpace(endpoint))
        {
            return "error";
        }

        using var request = new HttpRequestMessage(new HttpMethod(method), endpoint);
        if (config.TryGetProperty("headers", out var headers) && headers.ValueKind == JsonValueKind.Array)
        {
            foreach (var header in headers.EnumerateArray())
            {
                if (!TryGetTrimmedString(header, "key", out var headerKey) || string.IsNullOrWhiteSpace(headerKey))
                {
                    continue;
                }

                var headerValue = TryGetTrimmedString(header, "value", out var configuredHeaderValue)
                    ? Interpolate(configuredHeaderValue, new Dictionary<string, string>(variables))
                    : string.Empty;
                request.Headers.TryAddWithoutValidation(headerKey, headerValue);
            }
        }

        if (string.Equals(method, "POST", StringComparison.OrdinalIgnoreCase))
        {
            var body = TryGetTrimmedString(config, "body", out var configuredBody)
                ? Interpolate(configuredBody, new Dictionary<string, string>(variables))
                : string.Empty;
            request.Content = new StringContent(body ?? string.Empty, System.Text.Encoding.UTF8, "application/json");
        }

        var timeoutMs = config.TryGetProperty("timeoutMs", out var timeoutElement) && timeoutElement.ValueKind == JsonValueKind.Number && timeoutElement.TryGetInt32(out var configuredTimeout)
            ? configuredTimeout
            : 10000;

        try
        {
            using var cancellationSource = new System.Threading.CancellationTokenSource(TimeSpan.FromMilliseconds(timeoutMs));
            using var response = await client.SendAsync(request, cancellationSource.Token);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationSource.Token);

            if (!response.IsSuccessStatusCode)
            {
                return "error";
            }

            ApplyApiResponseMappings(config, responseBody, variables);
            return "success";
        }
        catch
        {
            return "error";
        }
    }

    private static void ApplyApiResponseMappings(JsonElement config, string responseBody, IDictionary<string, string> variables)
    {
        if (!config.TryGetProperty("responseMappings", out var responseMappings) || responseMappings.ValueKind != JsonValueKind.Array)
        {
            return;
        }

        JsonDocument responseDocument = null;

        foreach (var mapping in responseMappings.EnumerateArray())
        {
            if (!TryGetTrimmedString(mapping, "variableName", out var variableName) || string.IsNullOrWhiteSpace(variableName))
            {
                continue;
            }

            var path = TryGetTrimmedString(mapping, "path", out var configuredPath)
                ? configuredPath
                : "body";

            if (string.Equals(path, "body", StringComparison.OrdinalIgnoreCase))
            {
                variables[variableName] = responseBody ?? string.Empty;
                continue;
            }

            responseDocument ??= TryParseJsonDocument(responseBody);
            if (responseDocument == null)
            {
                variables[variableName] = string.Empty;
                continue;
            }

            variables[variableName] = ResolveJsonPathValue(responseDocument.RootElement, path);
        }

        responseDocument?.Dispose();
    }

    private static JsonDocument TryParseJsonDocument(string responseBody)
    {
        try
        {
            return JsonDocument.Parse(responseBody ?? string.Empty);
        }
        catch
        {
            return null;
        }
    }

    private static string ResolveJsonPathValue(JsonElement rootElement, string path)
    {
        var current = rootElement;
        foreach (var segment in (path ?? string.Empty).Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (current.ValueKind != JsonValueKind.Object)
            {
                return string.Empty;
            }

            var matchedProperty = current.EnumerateObject()
                .FirstOrDefault(property => string.Equals(property.Name, segment, StringComparison.OrdinalIgnoreCase));

            if (string.IsNullOrWhiteSpace(matchedProperty.Name))
            {
                return string.Empty;
            }

            current = matchedProperty.Value;
        }

        return current.ValueKind switch
        {
            JsonValueKind.String => current.GetString() ?? string.Empty,
            JsonValueKind.Number => current.ToString(),
            JsonValueKind.True => bool.TrueString.ToLowerInvariant(),
            JsonValueKind.False => bool.FalseString.ToLowerInvariant(),
            JsonValueKind.Null => string.Empty,
            _ => current.ToString()
        };
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

    private static bool IsValidEmail(string value)
    {
        var normalizedValue = value?.Trim() ?? string.Empty;
        return normalizedValue.Contains("@") && normalizedValue.Contains(".");
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

    private static string ResolveAwaitingInputMode(BotGraphDefinition graph, RuntimeSession session)
    {
        if (!session.AwaitingInput)
        {
            return string.Empty;
        }

        return IsChoiceQuestion(graph, session.CurrentNodeId) ? "choice" : "question";
    }

    private static List<string> ResolveSuggestedReplies(BotGraphDefinition graph, RuntimeSession session)
    {
        if (!session.AwaitingInput)
        {
            return [];
        }

        var questionNode = graph.Nodes.FirstOrDefault(node => node.Id == session.CurrentNodeId && IsNodeType(node, "question"));
        if (questionNode == null ||
            !questionNode.Config.TryGetProperty("options", out var options) ||
            options.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return EnumerateQuestionOptions(options)
            .Select(option => option.Label)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static bool IsChoiceQuestion(BotGraphDefinition graph, string currentNodeId)
    {
        var questionNode = graph.Nodes.FirstOrDefault(node => node.Id == currentNodeId && IsNodeType(node, "question"));
        return questionNode != null &&
               TryGetTrimmedString(questionNode.Config, "inputMode", out var inputMode) &&
               string.Equals(inputMode, "choice", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryResolveQuestionChoice(BotGraphDefinition graph, string currentNodeId, string userInput, out ResolvedQuestionChoice resolvedChoice)
    {
        resolvedChoice = null;
        var questionNode = graph.Nodes.FirstOrDefault(node => node.Id == currentNodeId && IsNodeType(node, "question"));
        if (questionNode == null || !IsChoiceQuestion(graph, currentNodeId))
        {
            return false;
        }

        if (!questionNode.Config.TryGetProperty("options", out var options) || options.ValueKind != JsonValueKind.Array)
        {
            return false;
        }

        foreach (var option in EnumerateQuestionOptions(options))
        {
            if (string.Equals(option.Label, userInput.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                resolvedChoice = new ResolvedQuestionChoice(option.HandleId, option.Value);
                return true;
            }
        }

        return false;
    }

    private static string GetInvalidQuestionInputMessage(BotGraphDefinition graph, string currentNodeId)
    {
        var questionNode = graph.Nodes.FirstOrDefault(node => node.Id == currentNodeId && IsNodeType(node, "question"));
        if (questionNode == null)
        {
            return "Please choose one of the available options.";
        }

        return TryGetTrimmedString(questionNode.Config, "invalidInputMessage", out var invalidInputMessage) &&
               !string.IsNullOrWhiteSpace(invalidInputMessage)
            ? invalidInputMessage
            : "Please choose one of the available options.";
    }

    private static IEnumerable<QuestionOption> EnumerateQuestionOptions(JsonElement options)
    {
        var index = 0;

        foreach (var option in options.EnumerateArray())
        {
            if (option.ValueKind == JsonValueKind.String)
            {
                var legacyLabel = option.GetString()?.Trim() ?? string.Empty;
                if (!string.IsNullOrWhiteSpace(legacyLabel))
                {
                    yield return new QuestionOption($"option-option-{index + 1}", legacyLabel, legacyLabel);
                }

                index += 1;
                continue;
            }

            var optionId = TryGetTrimmedString(option, "id", out var configuredOptionId)
                ? configuredOptionId
                : $"option-{index + 1}";
            var optionLabel = TryGetTrimmedString(option, "label", out var configuredOptionLabel)
                ? configuredOptionLabel
                : string.Empty;
            var optionValue = TryGetTrimmedString(option, "value", out var configuredOptionValue) &&
                              !string.IsNullOrWhiteSpace(configuredOptionValue)
                ? configuredOptionValue
                : optionLabel;

            if (!string.IsNullOrWhiteSpace(optionLabel))
            {
                yield return new QuestionOption($"option-{optionId}", optionLabel, optionValue);
            }

            index += 1;
        }
    }

    private static string ResolveCodeScript(JsonElement config)
    {
        if (TryGetTrimmedString(config, "script", out var script) && !string.IsNullOrWhiteSpace(script))
        {
            return script;
        }

        var targetVariable = TryGetTrimmedString(config, "targetVariable", out var configuredTargetVariable)
            ? configuredTargetVariable
            : "codeResult";
        var operation = TryGetTrimmedString(config, "operation", out var configuredOperation)
            ? configuredOperation
            : "template";
        var primaryInput = TryGetTrimmedString(config, "input", out var configuredInput)
            ? configuredInput
            : string.Empty;
        var secondInput = TryGetTrimmedString(config, "secondInput", out var configuredSecondInput)
            ? configuredSecondInput
            : string.Empty;

        return operation switch
        {
            "lowercase" => $"vars[{JsonSerializer.Serialize(targetVariable)}] = String(interpolate({JsonSerializer.Serialize(primaryInput)})).toLowerCase();",
            "uppercase" => $"vars[{JsonSerializer.Serialize(targetVariable)}] = String(interpolate({JsonSerializer.Serialize(primaryInput)})).toUpperCase();",
            "trim" => $"vars[{JsonSerializer.Serialize(targetVariable)}] = String(interpolate({JsonSerializer.Serialize(primaryInput)})).trim();",
            "concat" => $"vars[{JsonSerializer.Serialize(targetVariable)}] = String(interpolate({JsonSerializer.Serialize(primaryInput)})) + String(interpolate({JsonSerializer.Serialize(secondInput)}));",
            _ => $"vars[{JsonSerializer.Serialize(targetVariable)}] = interpolate({JsonSerializer.Serialize(primaryInput)});"
        };
    }

    private static List<BotValidationIssue> BuildAiRuntimeIssues(BotDefinition bot, BotGraphDefinition graph)
    {
        if (!graph.Nodes.Any(node => string.Equals(node.Type, "ai", StringComparison.OrdinalIgnoreCase)))
        {
            return [];
        }

        var issues = new List<BotValidationIssue>();
        var knowledge = DeserializeAiKnowledge(bot.AiKnowledgeJson);
        var readySourceCount = knowledge.Sources.Count(source =>
            string.Equals(source.Status, BotAiKnowledgeSourceStatus.Ready, StringComparison.OrdinalIgnoreCase) &&
            source.Chunks.Count > 0);

        if (string.IsNullOrWhiteSpace(bot.AiApiKeyEncrypted))
        {
            issues.Add(new BotValidationIssue
            {
                Id = "runtime-ai-provider-key-missing",
                Severity = BotValidationSeverity.Error,
                Message = "AI nodes require a configured Gemini API key for this bot."
            });
        }

        if (readySourceCount == 0)
        {
            issues.Add(new BotValidationIssue
            {
                Id = "runtime-ai-knowledge-missing",
                Severity = BotValidationSeverity.Error,
                Message = "AI nodes require at least one ready knowledge source for this bot."
            });
        }

        return issues;
    }

    private static BotAiKnowledgeSnapshot DeserializeAiKnowledge(string knowledgeJson)
    {
        return JsonSerializer.Deserialize<BotAiKnowledgeSnapshot>(knowledgeJson ?? string.Empty, JsonOptions)
               ?? new BotAiKnowledgeSnapshot();
    }

    private static string ResolveAiApiKey(BotDefinition bot)
    {
        return string.IsNullOrWhiteSpace(bot.AiApiKeyEncrypted)
            ? string.Empty
            : SimpleStringCipher.Instance.Decrypt(bot.AiApiKeyEncrypted);
    }

    private static string ResolveAiGenerationModel(BotDefinition bot)
    {
        return string.IsNullOrWhiteSpace(bot.AiGenerationModel) ? "gemini-2.5-flash" : bot.AiGenerationModel.Trim();
    }

    private static string ResolveAiEmbeddingModel(BotDefinition bot)
    {
        return string.IsNullOrWhiteSpace(bot.AiEmbeddingModel) ? "gemini-embedding-001" : bot.AiEmbeddingModel.Trim();
    }

    private static double CosineSimilarity(IReadOnlyList<float> left, IReadOnlyList<float> right)
    {
        if (left.Count == 0 || right.Count == 0 || left.Count != right.Count)
        {
            return 0;
        }

        double dot = 0;
        double leftMagnitude = 0;
        double rightMagnitude = 0;

        for (var index = 0; index < left.Count; index += 1)
        {
            dot += left[index] * right[index];
            leftMagnitude += left[index] * left[index];
            rightMagnitude += right[index] * right[index];
        }

        if (leftMagnitude <= 0 || rightMagnitude <= 0)
        {
            return 0;
        }

        return dot / (Math.Sqrt(leftMagnitude) * Math.Sqrt(rightMagnitude));
    }

    private static string BuildAiPrompt(
        string instructions,
        string latestUserMessage,
        IReadOnlyList<string> relevantChunks,
        string responseMode,
        string fallbackText)
    {
        var builder = new StringBuilder();
        builder.AppendLine("You are responding inside a conversational bot flow.");
        builder.AppendLine($"Response mode: {responseMode}.");
        builder.AppendLine();
        builder.AppendLine("Node instructions:");
        builder.AppendLine(string.IsNullOrWhiteSpace(instructions) ? "No additional instructions were provided." : instructions);
        builder.AppendLine();
        builder.AppendLine("Latest user message:");
        builder.AppendLine(string.IsNullOrWhiteSpace(latestUserMessage) ? "No explicit user message was provided." : latestUserMessage);
        builder.AppendLine();

        if (relevantChunks.Count > 0)
        {
            builder.AppendLine("Knowledge context:");
            for (var index = 0; index < relevantChunks.Count; index += 1)
            {
                builder.AppendLine($"[{index + 1}] {relevantChunks[index]}");
            }

            builder.AppendLine();
        }

        builder.AppendLine(
            string.Equals(responseMode, "strict", StringComparison.OrdinalIgnoreCase)
                ? $"Answer only from the knowledge context. If the answer is not supported there, respond exactly with: {fallbackText}"
                : string.Equals(responseMode, "hybrid", StringComparison.OrdinalIgnoreCase)
                    ? "Prioritize the knowledge context first. If it is partial, provide a helpful answer while staying aligned with the context."
                    : "Use the knowledge context when helpful, but you may answer broadly.");
        builder.AppendLine("Keep the response concise and ready to send directly to an end user.");

        return builder.ToString();
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

        public WidgetHandoffDto Handoff { get; set; }
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

    private sealed record QuestionOption(string HandleId, string Label, string Value);

    private sealed record ResolvedQuestionChoice(string HandleId, string StoredValue);

    private sealed record ResolvedHandoff(WidgetHandoffDto Handoff, string ConfirmationMessage, string FailureMessage);
}
