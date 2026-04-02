using System;
using System.Collections.Generic;
using System.Linq;
using Abp.Dependency;
using ConversaStudio.Domains.Bots;

namespace ConversaStudio.Domains.Runtime;

/// <summary>
/// Validates whether a published graph can be executed by the live widget runtime.
/// </summary>
public class PublishedGraphRuntimeValidator : ITransientDependency
{
    private static readonly HashSet<string> SupportedNodeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "start",
        "message",
        "question",
        "condition",
        "variable",
        "api",
        "ai",
        "code",
        "handoff",
        "end"
    };

    private readonly BotGraphValidator _botGraphValidator;

    public PublishedGraphRuntimeValidator(BotGraphValidator botGraphValidator)
    {
        _botGraphValidator = botGraphValidator;
    }

    /// <summary>
    /// Validates a graph for live runtime execution.
    /// </summary>
    public IReadOnlyList<BotValidationIssue> ValidateForLiveRuntime(BotGraphDefinition graph)
    {
        var issues = _botGraphValidator.Validate(graph).ToList();

        foreach (var node in graph.Nodes)
        {
            if (!SupportedNodeTypes.Contains(node.Type))
            {
                issues.Add(new BotValidationIssue
                {
                    Id = $"unsupported-runtime-node-{node.Id}",
                    Severity = BotValidationSeverity.Error,
                    Message = $"{node.Label} uses node type '{node.Type}' which is not supported by live deployment yet.",
                    RelatedNodeId = node.Id
                });
            }
        }

        return issues;
    }
}
