"use client";

import {
  BranchesOutlined,
  CloudOutlined,
  CodeOutlined,
  DatabaseOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  StopOutlined,
  BulbOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import type { NodeDefinition, NodeType } from "./types";

export const nodeRegistry: Record<NodeType, NodeDefinition> = {
  start: {
    type: "start",
    label: "Start",
    description: "Trigger the conversation flow.",
    icon: <PlayCircleOutlined />,
    accentColor: "#10B981",
    defaultConfig: () => ({ kind: "start" }),
  },
  message: {
    type: "message",
    label: "Message",
    description: "Send a fixed message to the user.",
    icon: <MessageOutlined />,
    accentColor: "#111111",
    defaultConfig: () => ({
      kind: "message",
      message: "Hi there. How can I help today?",
    }),
  },
  question: {
    type: "question",
    label: "Question",
    description: "Ask for input and capture it into a variable.",
    icon: <QuestionCircleOutlined />,
    accentColor: "#2563EB",
    defaultConfig: () => ({
      kind: "question",
      question: "What can I help you with today?",
      variableName: "userIntent",
    }),
  },
  condition: {
    type: "condition",
    label: "Condition",
    description: "Branch based on a captured or computed variable.",
    icon: <BranchesOutlined />,
    accentColor: "#D97706",
    defaultConfig: () => ({
      kind: "condition",
      variableName: "",
      rules: [
        {
          id: "condition-rule-1",
          operator: "equals",
          value: "faq",
        },
      ],
      fallbackLabel: "Fallback",
    }),
  },
  variable: {
    type: "variable",
    label: "Variable",
    description: "Set or transform a session variable.",
    icon: <DatabaseOutlined />,
    accentColor: "#7C3AED",
    defaultConfig: () => ({
      kind: "variable",
      variableName: "customerName",
      operation: "set",
      value: "",
      sourceVariableName: "",
    }),
  },
  api: {
    type: "api",
    label: "API Call",
    description: "Call an external service from the flow.",
    icon: <CloudOutlined />,
    accentColor: "#0EA5E9",
    defaultConfig: () => ({
      kind: "api",
      endpoint: "https://api.example.com/orders",
      method: "GET",
    }),
  },
  ai: {
    type: "ai",
    label: "AI Node",
    description: "Answer flexibly from instructions or knowledge.",
    icon: <BulbOutlined />,
    accentColor: "#EC4899",
    defaultConfig: () => ({
      kind: "ai",
      instructions: "Answer the question using the attached knowledge base.",
      fallbackText: "I’m not confident enough to answer that yet.",
    }),
  },
  code: {
    type: "code",
    label: "Code",
    description: "Run custom logic before choosing the next path.",
    icon: <CodeOutlined />,
    accentColor: "#4B5563",
    defaultConfig: () => ({
      kind: "code",
      snippet: "return { onSuccess: true };",
    }),
  },
  handoff: {
    type: "handoff",
    label: "Handoff",
    description: "Escalate the conversation to a human.",
    icon: <UserSwitchOutlined />,
    accentColor: "#DC2626",
    defaultConfig: () => ({
      kind: "handoff",
      queueName: "support-team",
    }),
  },
  end: {
    type: "end",
    label: "End",
    description: "Finish the bot conversation.",
    icon: <StopOutlined />,
    accentColor: "#6B7280",
    defaultConfig: () => ({
      kind: "end",
      closingText: "Thanks for chatting with us.",
    }),
  },
};

export const nodePalette = Object.values(nodeRegistry);
