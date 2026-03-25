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

function createStarterGraph(id: string, name: string): BotGraph {
  const startNode = createNode("start-node", "start", "Start", 120, 80);
  const messageNode = createNode("message-node", "message", "Welcome Message", 120, 230);

  if (messageNode.config.kind === "message") {
    messageNode.config.message =
      "Welcome to Conversa Studio. Ask me about support, pricing, or getting started.";
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

const projectGraphs: Record<string, BotGraph> = {
  "customer-support-bot": {
    metadata: {
      id: "customer-support-bot",
      name: "Customer Support Bot",
      status: "saved",
      version: "v3",
    },
    nodes: [
      createNode("start-node", "start", "Start", 200, 40),
      createNode("welcome-message", "message", "Welcome Message", 200, 180),
      createNode("ask-intent", "question", "Ask Intent", 200, 340),
      createNode("check-intent", "condition", "Check Intent", 200, 520),
      createNode("faq-answer", "ai", "FAQ AI Answer", 20, 720),
      createNode("handoff-node", "handoff", "Escalate to Support", 380, 720),
      createNode("end-node", "end", "End Chat", 380, 920),
    ],
    edges: [
      { id: "edge-start-welcome", source: "start-node", target: "welcome-message" },
      { id: "edge-welcome-intent", source: "welcome-message", target: "ask-intent" },
      { id: "edge-intent-condition", source: "ask-intent", target: "check-intent" },
      {
        id: "edge-condition-faq",
        source: "check-intent",
        sourceHandle: "rule-0",
        target: "faq-answer",
        label: "FAQ",
      },
      {
        id: "edge-condition-fallback",
        source: "check-intent",
        sourceHandle: "fallback",
        target: "handoff-node",
        label: "Fallback",
      },
      { id: "edge-handoff-end", source: "handoff-node", target: "end-node" },
    ],
  },
  "lead-qualification-bot": {
    metadata: {
      id: "lead-qualification-bot",
      name: "Lead Qualification Bot",
      status: "draft",
      version: "v1",
    },
    nodes: [
      createNode("start-node", "start", "Start", 180, 60),
      createNode("intro-message", "message", "Intro Message", 180, 220),
      createNode("ask-name", "question", "Ask Name", 180, 380),
      createNode("ask-company", "question", "Ask Company", 180, 540),
      createNode("end-node", "end", "End", 180, 700),
    ],
    edges: [
      { id: "edge-a", source: "start-node", target: "intro-message" },
      { id: "edge-b", source: "intro-message", target: "ask-name" },
      { id: "edge-c", source: "ask-name", target: "ask-company" },
      { id: "edge-d", source: "ask-company", target: "end-node" },
    ],
  },
  "internal-it-helpdesk": {
    metadata: {
      id: "internal-it-helpdesk",
      name: "Internal IT Helpdesk",
      status: "saved",
      version: "v2",
    },
    nodes: [
      createNode("start-node", "start", "Start", 240, 70),
      createNode("triage-message", "message", "Triage Message", 240, 220),
      createNode("issue-type", "question", "Issue Type", 240, 380),
      createNode("assign-priority", "variable", "Assign Priority", 240, 560),
      createNode("end-node", "end", "End", 240, 740),
    ],
    edges: [
      { id: "edge-1", source: "start-node", target: "triage-message" },
      { id: "edge-2", source: "triage-message", target: "issue-type" },
      { id: "edge-3", source: "issue-type", target: "assign-priority" },
      { id: "edge-4", source: "assign-priority", target: "end-node" },
    ],
  },
};

projectGraphs["customer-support-bot"].nodes.forEach((node) => {
  if (node.id === "welcome-message" && node.config.kind === "message") {
    node.config.message =
      "Hi there. I can help with FAQs, billing questions, or connect you to support.";
  }

  if (node.id === "ask-intent" && node.config.kind === "question") {
    node.config.question = "What can I help you with today?";
    node.config.variableName = "intent";
  }

  if (node.id === "check-intent" && node.config.kind === "condition") {
    node.config.rules = [
      {
        id: "rule-faq",
        source: "intent",
        operator: "contains",
        value: "faq",
      },
    ];
    node.config.fallbackLabel = "Escalate";
  }

  if (node.id === "faq-answer" && node.config.kind === "ai") {
    node.config.instructions =
      "Answer common support questions using the approved support knowledge base.";
    node.config.fallbackText =
      "I can connect you with a human teammate if you need more help.";
  }
});

projectGraphs["lead-qualification-bot"].nodes.forEach((node) => {
  if (node.id === "intro-message" && node.config.kind === "message") {
    node.config.message = "Welcome. I’ll ask a couple of quick qualification questions.";
  }
  if (node.id === "ask-name" && node.config.kind === "question") {
    node.config.question = "What is your name?";
    node.config.variableName = "fullName";
  }
  if (node.id === "ask-company" && node.config.kind === "question") {
    node.config.question = "Which company are you with?";
    node.config.variableName = "company";
  }
  if (node.id === "end-node" && node.config.kind === "end") {
    node.config.closingText = "Thanks. We’ll use that info to route your lead.";
  }
});

projectGraphs["internal-it-helpdesk"].nodes.forEach((node) => {
  if (node.id === "triage-message" && node.config.kind === "message") {
    node.config.message = "Tell me a bit about your issue and I’ll route it.";
  }
  if (node.id === "issue-type" && node.config.kind === "question") {
    node.config.question = "Is this about hardware, software, or access?";
    node.config.variableName = "issueType";
  }
  if (node.id === "assign-priority" && node.config.kind === "variable") {
    node.config.variableName = "priority";
    node.config.value = "normal";
  }
});

export function getMockGraph(botId?: string): BotGraph {
  if (!botId) {
    return createStarterGraph("new-bot", "Untitled Bot");
  }

  return structuredClone(
    projectGraphs[botId] ??
      createStarterGraph(
        botId,
        botId
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
      ),
  );
}
