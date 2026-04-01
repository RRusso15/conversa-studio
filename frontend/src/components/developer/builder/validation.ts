import type { BotGraph, ValidationResult } from "./types";
import type { IAiKnowledgeStatus } from "@/utils/ai-knowledge-api";
import {
  conditionOperatorRequiresValue,
  collectGraphVariables,
  extractVariableReferences,
  getQuestionChoiceHandleId,
  getNodeTextTemplates,
  getVariableOperation,
} from "./variable-utils";

function traverseReachableNodes(graph: BotGraph, startNodeId: string) {
  const visited = new Set<string>();
  const adjacency = new Map<string, string[]>();

  graph.edges.forEach((edge) => {
    const targets = adjacency.get(edge.source) ?? [];
    targets.push(edge.target);
    adjacency.set(edge.source, targets);
  });

  const stack = [startNodeId];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    (adjacency.get(current) ?? []).forEach((target) => {
      if (!visited.has(target)) {
        stack.push(target);
      }
    });
  }

  return visited;
}

export function validateBotGraph(
  graph: BotGraph,
  aiKnowledge?: IAiKnowledgeStatus,
  draftIdentity: "temporary" | "persisted" = "temporary",
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const startNodes = graph.nodes.filter((node) => node.type === "start");
  const endNodes = graph.nodes.filter((node) => node.type === "end");
  const definedVariables = new Set(collectGraphVariables(graph));

  if (startNodes.length !== 1) {
    results.push({
      id: "start-node-count",
      severity: "error",
      message:
        startNodes.length === 0
          ? "Exactly one start node is required."
          : "Only one start node is allowed.",
      relatedNodeId: startNodes[0]?.id,
    });
  }

  graph.edges.forEach((edge) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      results.push({
        id: `broken-edge-${edge.id}`,
        severity: "error",
        message: "Edge references a node that does not exist.",
        relatedEdgeId: edge.id,
      });
    }
  });

  if (startNodes.length === 1) {
    const reachable = traverseReachableNodes(graph, startNodes[0].id);

    graph.nodes.forEach((node) => {
      if (!reachable.has(node.id) && node.type !== "start") {
        results.push({
          id: `orphan-${node.id}`,
          severity: "error",
          message: `${node.label} is not reachable from the start node.`,
          relatedNodeId: node.id,
        });
      }
    });
  }

  graph.nodes.forEach((node) => {
    if (node.type === "message" && node.config.kind === "message" && !node.config.message.trim()) {
      results.push({
        id: `message-config-${node.id}`,
        severity: "error",
        message: "Message nodes require message text.",
        relatedNodeId: node.id,
      });
    }

    if (node.type === "question" && node.config.kind === "question") {
      const outgoingEdges = graph.edges.filter((edge) => edge.source === node.id);
      if (!node.config.question.trim()) {
        results.push({
          id: `question-text-${node.id}`,
          severity: "error",
          message: "Question nodes require a question prompt.",
          relatedNodeId: node.id,
        });
      }

      if (!node.config.variableName.trim()) {
        results.push({
          id: `question-variable-${node.id}`,
          severity: "error",
          message: "Question nodes require a variable name.",
          relatedNodeId: node.id,
        });
      }

      if ((node.config.inputMode ?? "text") === "choice") {
        const normalizedOptions = (node.config.options ?? [])
          .map((option) => ({
            id: option.id.trim(),
            label: option.label.trim(),
          }))
          .filter((option) => option.label.length > 0);

        if (normalizedOptions.length === 0) {
          results.push({
            id: `question-options-${node.id}`,
            severity: "error",
            message: "Choice questions require at least one option.",
            relatedNodeId: node.id,
          });
        }

        if (new Set(normalizedOptions.map((option) => option.label.toLowerCase())).size !== normalizedOptions.length) {
          results.push({
            id: `question-options-duplicate-${node.id}`,
            severity: "error",
            message: "Choice question options should be unique.",
            relatedNodeId: node.id,
          });
        }

        if (new Set(normalizedOptions.map((option) => option.id)).size !== normalizedOptions.length) {
          results.push({
            id: `question-options-id-${node.id}`,
            severity: "error",
            message: "Choice question options require stable unique IDs.",
            relatedNodeId: node.id,
          });
        }

        const duplicateHandles = outgoingEdges.reduce<Map<string, number>>((map, edge) => {
          const sourceHandle = edge.sourceHandle || "";
          map.set(sourceHandle, (map.get(sourceHandle) ?? 0) + 1);
          return map;
        }, new Map<string, number>());

        duplicateHandles.forEach((count, sourceHandle) => {
          if (count <= 1 || sourceHandle === "invalid" || !sourceHandle.startsWith("option-")) {
            return;
          }

          results.push({
            id: `question-duplicate-handle-${node.id}-${sourceHandle}`,
            severity: "warning",
            message: "Choice option handles should only have one outgoing edge each.",
            relatedNodeId: node.id,
          });
        });

        normalizedOptions.forEach((option, index) => {
          if (!outgoingEdges.some((edge) => edge.sourceHandle === getQuestionChoiceHandleId(option.id))) {
            results.push({
              id: `question-option-edge-${node.id}-${index}`,
              severity: "warning",
              message: `Choice option "${option.label}" does not have an outgoing edge.`,
              relatedNodeId: node.id,
            });
          }
        });
      }
    }

    if (node.type === "condition" && node.config.kind === "condition") {
      const outgoingEdges = graph.edges.filter((edge) => edge.source === node.id);

      if (node.config.rules.length === 0) {
        results.push({
          id: `condition-rules-${node.id}`,
          severity: "error",
          message: "Condition nodes require at least one rule.",
          relatedNodeId: node.id,
        });
      }

      if (!node.config.variableName.trim()) {
        results.push({
          id: `condition-variable-${node.id}`,
          severity: "error",
          message: "Condition nodes require a source variable.",
          relatedNodeId: node.id,
        });
      }

      if (
        node.config.variableName.trim() &&
        !definedVariables.has(node.config.variableName.trim())
      ) {
        results.push({
          id: `condition-variable-unknown-${node.id}`,
          severity: "error",
          message: `Condition source variable "${node.config.variableName}" does not exist in this graph yet.`,
          relatedNodeId: node.id,
        });
      }

      const duplicateHandles = outgoingEdges.reduce<Map<string, number>>((map, edge) => {
        const sourceHandle = edge.sourceHandle || "";
        map.set(sourceHandle, (map.get(sourceHandle) ?? 0) + 1);
        return map;
      }, new Map<string, number>());

      duplicateHandles.forEach((count, sourceHandle) => {
        if (count <= 1) {
          return;
        }

        results.push({
          id: `condition-duplicate-handle-${node.id}-${sourceHandle || "default"}`,
          severity: "warning",
          message: sourceHandle === "fallback"
            ? "Fallback route has multiple outgoing edges. Only one edge should leave the fallback handle."
            : `Condition rule handle "${sourceHandle}" has multiple outgoing edges. Only one edge should leave each rule handle.`,
          relatedNodeId: node.id,
        });
      });

      const seenRules = new Set<string>();

      node.config.rules.forEach((rule, index) => {
        const requiresValue = conditionOperatorRequiresValue(rule.operator);
        const normalizedRuleSignature = `${rule.operator}:${rule.value.trim().toLowerCase()}`;
        const hasOutgoingRuleEdge = outgoingEdges.some(
          (edge) => edge.sourceHandle === `rule-${index}`,
        );

        if (requiresValue && !rule.value.trim()) {
          results.push({
            id: `condition-rule-value-${node.id}-${index}`,
            severity: "error",
            message: `Rule ${index + 1} requires a value.`,
            relatedNodeId: node.id,
          });
        }

        if (seenRules.has(normalizedRuleSignature)) {
          results.push({
            id: `condition-rule-duplicate-${node.id}-${index}`,
            severity: "warning",
            message: `Rule ${index + 1} duplicates an earlier rule and may never be reached.`,
            relatedNodeId: node.id,
          });
        } else {
          seenRules.add(normalizedRuleSignature);
        }

        if (!hasOutgoingRuleEdge) {
          results.push({
            id: `condition-rule-edge-${node.id}-${index}`,
            severity: "warning",
            message: `Rule ${index + 1} does not have an outgoing edge.`,
            relatedNodeId: node.id,
          });
        }
      });

      const hasFallbackEdge = outgoingEdges.some((edge) => edge.sourceHandle === "fallback");

      if (!hasFallbackEdge) {
        results.push({
          id: `condition-fallback-edge-${node.id}`,
          severity: "warning",
          message: "Fallback route does not have an outgoing edge.",
          relatedNodeId: node.id,
        });
      }
    }

    if (node.type === "variable" && node.config.kind === "variable") {
      if (!node.config.variableName.trim()) {
        results.push({
          id: `variable-name-${node.id}`,
          severity: "error",
          message: "Variable nodes require a target variable name.",
          relatedNodeId: node.id,
        });
      }

      if (getVariableOperation(node.config) === "copy" && !node.config.sourceVariableName?.trim()) {
        results.push({
          id: `variable-copy-source-${node.id}`,
          severity: "error",
          message: "Copy operations require a source variable.",
          relatedNodeId: node.id,
        });
      }

      if (
        getVariableOperation(node.config) === "copy" &&
        node.config.sourceVariableName?.trim() &&
        !definedVariables.has(node.config.sourceVariableName.trim())
      ) {
        results.push({
          id: `variable-copy-unknown-${node.id}`,
          severity: "error",
          message: `Source variable "${node.config.sourceVariableName}" does not exist in this graph yet.`,
          relatedNodeId: node.id,
        });
      }
    }

    if (node.type === "api" && node.config.kind === "api") {
      const outgoingEdges = graph.edges.filter((edge) => edge.source === node.id);
      const duplicateHandles = outgoingEdges.reduce<Map<string, number>>((map, edge) => {
        const sourceHandle = edge.sourceHandle || "";
        map.set(sourceHandle, (map.get(sourceHandle) ?? 0) + 1);
        return map;
      }, new Map<string, number>());

      if (!node.config.endpoint.trim()) {
        results.push({
          id: `api-endpoint-${node.id}`,
          severity: "error",
          message: "API nodes require an endpoint.",
          relatedNodeId: node.id,
        });
      }

      if (!node.config.method.trim()) {
        results.push({
          id: `api-method-${node.id}`,
          severity: "error",
          message: "API nodes require a method.",
          relatedNodeId: node.id,
        });
      }

      if ((node.config.timeoutMs ?? 0) <= 0) {
        results.push({
          id: `api-timeout-${node.id}`,
          severity: "error",
          message: "API nodes require a timeout greater than zero.",
          relatedNodeId: node.id,
        });
      }

      (node.config.responseMappings ?? []).forEach((mapping, index) => {
        if (!mapping.variableName.trim()) {
          results.push({
            id: `api-mapping-variable-${node.id}-${index}`,
            severity: "error",
            message: `Response mapping ${index + 1} requires a target variable.`,
            relatedNodeId: node.id,
          });
        }

        if (!mapping.path.trim()) {
          results.push({
            id: `api-mapping-path-${node.id}-${index}`,
            severity: "warning",
            message: `Response mapping ${index + 1} has no path. The raw response body will be used.`,
            relatedNodeId: node.id,
          });
        }
      });

      duplicateHandles.forEach((count, sourceHandle) => {
        if (count <= 1) {
          return;
        }

        results.push({
          id: `api-duplicate-handle-${node.id}-${sourceHandle || "default"}`,
          severity: "warning",
          message:
            sourceHandle === "error"
              ? "API error route has multiple outgoing edges. Only one edge should leave the error handle."
              : "API success route has multiple outgoing edges. Only one edge should leave the success handle.",
          relatedNodeId: node.id,
        });
      });

      if (!outgoingEdges.some((edge) => edge.sourceHandle === "success")) {
        results.push({
          id: `api-success-edge-${node.id}`,
          severity: "warning",
          message: "API success route does not have an outgoing edge.",
          relatedNodeId: node.id,
        });
      }

      if (!outgoingEdges.some((edge) => edge.sourceHandle === "error")) {
        results.push({
          id: `api-error-edge-${node.id}`,
          severity: "warning",
          message: "API error route does not have an outgoing edge.",
          relatedNodeId: node.id,
        });
      }
    }

    if (node.type === "ai" && node.config.kind === "ai") {
      if (!node.config.instructions.trim()) {
        results.push({
          id: `ai-instructions-${node.id}`,
          severity: "error",
          message: "AI nodes require instructions.",
          relatedNodeId: node.id,
        });
      }

      if (draftIdentity !== "persisted") {
        results.push({
          id: `ai-unsaved-bot-${node.id}`,
          severity: "warning",
          message: "Save this bot first, then configure the shared AI knowledge hub for AI nodes.",
          relatedNodeId: node.id,
        });
      } else {
        if (!aiKnowledge?.hasApiKey) {
          results.push({
            id: `ai-api-key-${node.id}`,
            severity: "error",
            message: "AI nodes require a configured Gemini API key for this bot.",
            relatedNodeId: node.id,
          });
        }

        if ((aiKnowledge?.readySourceCount ?? 0) <= 0) {
          results.push({
            id: `ai-knowledge-${node.id}`,
            severity: "error",
            message: "AI nodes require at least one ready knowledge source for this bot.",
            relatedNodeId: node.id,
          });
        }
      }
    }

    if (node.type === "code" && node.config.kind === "code") {
      const outgoingEdges = graph.edges.filter((edge) => edge.source === node.id);

      if (!node.config.script.trim()) {
        results.push({
          id: `code-script-${node.id}`,
          severity: "error",
          message: "Code nodes require JavaScript.",
          relatedNodeId: node.id,
        });
      }

      if ((node.config.timeoutMs ?? 0) <= 0) {
        results.push({
          id: `code-timeout-${node.id}`,
          severity: "error",
          message: "Code nodes require a timeout greater than zero.",
          relatedNodeId: node.id,
        });
      }

      if (!outgoingEdges.some((edge) => edge.sourceHandle === "success")) {
        results.push({
          id: `code-success-edge-${node.id}`,
          severity: "warning",
          message: "Code success route does not have an outgoing edge.",
          relatedNodeId: node.id,
        });
      }

      if (!outgoingEdges.some((edge) => edge.sourceHandle === "error")) {
        results.push({
          id: `code-error-edge-${node.id}`,
          severity: "warning",
          message: "Code error route does not have an outgoing edge.",
          relatedNodeId: node.id,
        });
      }
    }

    getNodeTextTemplates(node.config).forEach((template, index) => {
      extractVariableReferences(template).forEach((variableName) => {
        if (!definedVariables.has(variableName)) {
          results.push({
            id: `unknown-variable-${node.id}-${index}-${variableName}`,
            severity: "error",
            message: `Variable "${variableName}" is referenced before it is defined.`,
            relatedNodeId: node.id,
          });
        }
      });
    });
  });

  if (endNodes.length === 0) {
    results.push({
      id: "missing-end-node",
      severity: "warning",
      message: "No end node was found. The graph can still be edited, but it lacks a terminal path.",
    });
  }

  return results;
}
