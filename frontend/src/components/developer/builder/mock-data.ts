import type { BotGraph, BotNode, NodeType } from "./types";
import { nodeRegistry } from "./node-registry";

function createNode(
  id: string,
  type: NodeType,
  label: string,
  x: number,
  y: number,
): BotNode {
  return {
    id,
    type,
    label,
    position: { x, y },
    config: nodeRegistry[type].defaultConfig(),
  };
}

export function createStarterGraph(id: string, name: string): BotGraph {
  const startNode = createNode("start-node", "start", "Start", 120, 80);
  const messageNode = createNode("message-node", "message", "Welcome Message", 120, 230);

  if (messageNode.config.kind === "message") {
    messageNode.config.message =
      "Welcome to Conversa Studio. Ask me about support, getting started, or how to build your first bot.";
  }

  return {
    metadata: {
      id,
      name,
      status: "draft",
      version: "v1",
    },
    nodes: [startNode, messageNode],
    edges: [
      {
        id: "edge-start-message",
        source: startNode.id,
        target: messageNode.id,
        label: "Next",
      },
    ],
  };
}
