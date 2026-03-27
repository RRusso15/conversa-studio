import type { BotGraph, ValidationResult } from "./types";

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

export function validateBotGraph(graph: BotGraph): ValidationResult[] {
  const results: ValidationResult[] = [];
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const startNodes = graph.nodes.filter((node) => node.type === "start");
  const endNodes = graph.nodes.filter((node) => node.type === "end");

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
    }

    if (node.type === "condition" && node.config.kind === "condition") {
      if (node.config.rules.length === 0 && !node.config.fallbackLabel.trim()) {
        results.push({
          id: `condition-rules-${node.id}`,
          severity: "error",
          message: "Condition nodes require at least one rule or fallback path.",
          relatedNodeId: node.id,
        });
      }
    }

    if (node.type === "ai" && node.config.kind === "ai" && !node.config.instructions.trim()) {
      results.push({
        id: `ai-instructions-${node.id}`,
        severity: "error",
        message: "AI nodes require instructions.",
        relatedNodeId: node.id,
      });
    }
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
