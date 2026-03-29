using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Abp.Dependency;

namespace ConversaStudio.Domains.Bots;

/// <summary>
/// Validates persisted bot graph structures before they are stored or executed.
/// </summary>
public class BotGraphValidator : ITransientDependency
{
    /// <summary>
    /// Validates a bot graph and returns all detected issues.
    /// </summary>
    public IReadOnlyList<BotValidationIssue> Validate(BotGraphDefinition graph)
    {
        var issues = new List<BotValidationIssue>();
        var nodeIds = graph.Nodes
            .Where(node => !string.IsNullOrWhiteSpace(node.Id))
            .Select(node => node.Id)
            .ToList();
        var startNodes = graph.Nodes.Where(node => string.Equals(node.Type, "start", StringComparison.OrdinalIgnoreCase)).ToList();

        if (startNodes.Count != 1)
        {
            issues.Add(new BotValidationIssue
            {
                Id = "start-node-count",
                Severity = BotValidationSeverity.Error,
                Message = startNodes.Count == 0 ? "Exactly one start node is required." : "Only one start node is allowed."
            });
        }

        var duplicateNodeId = nodeIds
            .GroupBy(nodeId => nodeId, StringComparer.Ordinal)
            .FirstOrDefault(group => group.Count() > 1);
        if (duplicateNodeId != null)
        {
            issues.Add(new BotValidationIssue
            {
                Id = "duplicate-node-id",
                Severity = BotValidationSeverity.Error,
                Message = $"Node ID '{duplicateNodeId.Key}' is duplicated."
            });
        }

        foreach (var node in graph.Nodes)
        {
            ValidateNode(node, issues);
        }

        var knownNodeIds = new HashSet<string>(nodeIds, StringComparer.Ordinal);
        foreach (var edge in graph.Edges)
        {
            if (!knownNodeIds.Contains(edge.Source) || !knownNodeIds.Contains(edge.Target))
            {
                issues.Add(new BotValidationIssue
                {
                    Id = $"broken-edge-{edge.Id}",
                    Severity = BotValidationSeverity.Error,
                    Message = "Edge references a node that does not exist.",
                    RelatedEdgeId = edge.Id
                });
            }
        }

        if (startNodes.Count == 1)
        {
            var reachableNodes = TraverseReachableNodes(graph, startNodes[0].Id);
            foreach (var node in graph.Nodes.Where(node => !string.Equals(node.Type, "start", StringComparison.OrdinalIgnoreCase)))
            {
                if (!reachableNodes.Contains(node.Id))
                {
                    issues.Add(new BotValidationIssue
                    {
                        Id = $"orphan-{node.Id}",
                        Severity = BotValidationSeverity.Error,
                        Message = $"{node.Label} is not reachable from the start node.",
                        RelatedNodeId = node.Id
                    });
                }
            }
        }

        if (!graph.Nodes.Any(node => string.Equals(node.Type, "end", StringComparison.OrdinalIgnoreCase)))
        {
            issues.Add(new BotValidationIssue
            {
                Id = "missing-end-node",
                Severity = BotValidationSeverity.Warning,
                Message = "No end node was found. The graph can still be edited, but it lacks a terminal path."
            });
        }

        return issues;
    }

    private static HashSet<string> TraverseReachableNodes(BotGraphDefinition graph, string startNodeId)
    {
        var adjacency = graph.Edges
            .GroupBy(edge => edge.Source, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.Select(edge => edge.Target).ToList(), StringComparer.Ordinal);
        var visited = new HashSet<string>(StringComparer.Ordinal);
        var stack = new Stack<string>();
        stack.Push(startNodeId);

        while (stack.Count > 0)
        {
            var currentNodeId = stack.Pop();
            if (!visited.Add(currentNodeId))
            {
                continue;
            }

            if (!adjacency.TryGetValue(currentNodeId, out var targets))
            {
                continue;
            }

            foreach (var target in targets.Where(target => !visited.Contains(target)))
            {
                stack.Push(target);
            }
        }

        return visited;
    }

    private static void ValidateNode(BotNodeDefinition node, List<BotValidationIssue> issues)
    {
        if (string.IsNullOrWhiteSpace(node.Id))
        {
            issues.Add(new BotValidationIssue
            {
                Id = "node-id-missing",
                Severity = BotValidationSeverity.Error,
                Message = "Each node requires a valid ID."
            });
            return;
        }

        if (node.Config.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
        {
            issues.Add(new BotValidationIssue
            {
                Id = $"config-missing-{node.Id}",
                Severity = BotValidationSeverity.Error,
                Message = "Each node requires a config payload.",
                RelatedNodeId = node.Id
            });
            return;
        }

        switch (node.Type)
        {
            case "message":
                RequireStringProperty(node, "message", "Message nodes require message text.", issues);
                break;
            case "question":
                RequireStringProperty(node, "question", "Question nodes require a question prompt.", issues);
                RequireStringProperty(node, "variableName", "Question nodes require a variable name.", issues);
                if (TryGetTrimmedString(node.Config, "inputMode", out var inputMode) &&
                    string.Equals(inputMode, "choice", StringComparison.OrdinalIgnoreCase) &&
                    (!TryGetArrayLength(node.Config, "options", out var optionCount) || optionCount <= 0))
                {
                    issues.Add(new BotValidationIssue
                    {
                        Id = $"question-options-{node.Id}",
                        Severity = BotValidationSeverity.Error,
                        Message = "Choice questions require at least one option.",
                        RelatedNodeId = node.Id
                    });
                }
                break;
            case "condition":
                var hasRules = TryGetArrayLength(node.Config, "rules", out var ruleCount) && ruleCount > 0;
                var hasFallback = TryGetTrimmedString(node.Config, "fallbackLabel", out var fallbackLabel) && !string.IsNullOrWhiteSpace(fallbackLabel);
                if (!hasRules && !hasFallback)
                {
                    issues.Add(new BotValidationIssue
                    {
                        Id = $"condition-rules-{node.Id}",
                        Severity = BotValidationSeverity.Error,
                        Message = "Condition nodes require at least one rule or fallback path.",
                        RelatedNodeId = node.Id
                    });
                }
                break;
            case "variable":
                RequireStringProperty(node, "variableName", "Variable nodes require a variable name.", issues);
                break;
            case "api":
                RequireStringProperty(node, "endpoint", "API nodes require an endpoint.", issues);
                RequireStringProperty(node, "method", "API nodes require a method.", issues);
                if (node.Config.TryGetProperty("timeoutMs", out var timeoutProperty) &&
                    timeoutProperty.ValueKind == JsonValueKind.Number &&
                    timeoutProperty.TryGetInt32(out var timeoutMs) &&
                    timeoutMs <= 0)
                {
                    issues.Add(new BotValidationIssue
                    {
                        Id = $"api-timeout-{node.Id}",
                        Severity = BotValidationSeverity.Error,
                        Message = "API nodes require a timeout greater than zero.",
                        RelatedNodeId = node.Id
                    });
                }

                if (node.Config.TryGetProperty("responseMappings", out var responseMappings) && responseMappings.ValueKind == JsonValueKind.Array)
                {
                    var mappingIndex = 0;
                    foreach (var mapping in responseMappings.EnumerateArray())
                    {
                        if (!TryGetTrimmedString(mapping, "variableName", out var variableName) || string.IsNullOrWhiteSpace(variableName))
                        {
                            issues.Add(new BotValidationIssue
                            {
                                Id = $"api-response-variable-{node.Id}-{mappingIndex}",
                                Severity = BotValidationSeverity.Error,
                                Message = $"API response mapping {mappingIndex + 1} requires a target variable.",
                                RelatedNodeId = node.Id
                            });
                        }

                        mappingIndex += 1;
                    }
                }
                break;
            case "ai":
                RequireStringProperty(node, "instructions", "AI nodes require instructions.", issues);
                break;
            case "code":
                RequireStringProperty(node, "targetVariable", "Code nodes require a target variable.", issues);
                RequireStringProperty(node, "input", "Code nodes require an input value or template.", issues);
                if (TryGetTrimmedString(node.Config, "operation", out var operation) &&
                    string.Equals(operation, "concat", StringComparison.OrdinalIgnoreCase) &&
                    !TryGetTrimmedString(node.Config, "secondInput", out var secondInput))
                {
                    issues.Add(new BotValidationIssue
                    {
                        Id = $"code-second-input-{node.Id}",
                        Severity = BotValidationSeverity.Error,
                        Message = "Concat code nodes require a second input.",
                        RelatedNodeId = node.Id
                    });
                }
                break;
            case "handoff":
                RequireStringProperty(node, "queueName", "Handoff nodes require a queue name.", issues);
                break;
        }
    }

    private static void RequireStringProperty(BotNodeDefinition node, string propertyName, string message, List<BotValidationIssue> issues)
    {
        if (!TryGetTrimmedString(node.Config, propertyName, out var value) || string.IsNullOrWhiteSpace(value))
        {
            issues.Add(new BotValidationIssue
            {
                Id = $"{propertyName}-{node.Id}",
                Severity = BotValidationSeverity.Error,
                Message = message,
                RelatedNodeId = node.Id
            });
        }
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

    private static bool TryGetArrayLength(JsonElement element, string propertyName, out int length)
    {
        length = 0;
        if (!element.TryGetProperty(propertyName, out var property) || property.ValueKind != JsonValueKind.Array)
        {
            return false;
        }

        length = property.GetArrayLength();
        return true;
    }
}
