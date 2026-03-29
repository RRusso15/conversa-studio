import type { ReactNode } from "react";
import type { XYPosition } from "reactflow";

export type NodeType =
  | "start"
  | "message"
  | "question"
  | "condition"
  | "variable"
  | "api"
  | "ai"
  | "code"
  | "handoff"
  | "end";

export interface BotMetadata {
  id: string;
  name: string;
  status: "draft" | "published";
  version: string;
}

export interface StartNodeConfig {
  kind: "start";
}

export interface MessageNodeConfig {
  kind: "message";
  message: string;
}

export interface QuestionNodeConfig {
  kind: "question";
  question: string;
  variableName: string;
  inputMode?: "text" | "choice";
  options?: QuestionChoiceOption[];
  invalidInputMessage?: string;
}

export interface QuestionChoiceOption {
  id: string;
  label: string;
  value?: string;
}

export type ConditionOperator =
  | "equals"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "isEmpty"
  | "isNotEmpty";

export interface ConditionRule {
  id: string;
  operator: ConditionOperator;
  value: string;
}

export interface ConditionNodeConfig {
  kind: "condition";
  variableName: string;
  rules: ConditionRule[];
  fallbackLabel: string;
}

export type VariableOperation = "set" | "append" | "clear" | "copy";

export interface VariableNodeConfig {
  kind: "variable";
  variableName: string;
  operation?: VariableOperation;
  value: string;
  sourceVariableName?: string;
}

export interface ApiNodeConfig {
  kind: "api";
  endpoint: string;
  method: "GET" | "POST";
  headers?: Array<{
    id: string;
    key: string;
    value: string;
  }>;
  body?: string;
  timeoutMs?: number;
  responseMappings?: Array<{
    id: string;
    variableName: string;
    path: string;
  }>;
  successLabel?: string;
  errorLabel?: string;
}

export interface AiNodeConfig {
  kind: "ai";
  instructions: string;
  fallbackText: string;
}

export type CodeOperation =
  | "template"
  | "lowercase"
  | "uppercase"
  | "trim"
  | "concat";

export interface CodeNodeConfig {
  kind: "code";
  script: string;
  timeoutMs?: number;
}

export interface HandoffNodeConfig {
  kind: "handoff";
  queueName: string;
}

export interface EndNodeConfig {
  kind: "end";
  closingText: string;
}

export type NodeConfig =
  | StartNodeConfig
  | MessageNodeConfig
  | QuestionNodeConfig
  | ConditionNodeConfig
  | VariableNodeConfig
  | ApiNodeConfig
  | AiNodeConfig
  | CodeNodeConfig
  | HandoffNodeConfig
  | EndNodeConfig;

export interface BotNode {
  id: string;
  type: NodeType;
  label: string;
  position: XYPosition;
  config: NodeConfig;
}

export interface BotEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string;
}

export interface BotGraph {
  metadata: BotMetadata;
  nodes: BotNode[];
  edges: BotEdge[];
}

export type ValidationSeverity = "error" | "warning";

export interface ValidationResult {
  id: string;
  severity: ValidationSeverity;
  message: string;
  relatedNodeId?: string;
  relatedEdgeId?: string;
}

export interface NodeDefinition {
  type: NodeType;
  label: string;
  description: string;
  icon: ReactNode;
  accentColor: string;
  defaultConfig: () => NodeConfig;
}

export interface BuilderState {
  graph: BotGraph;
  selectedNodeId?: string;
  selectedEdgeId?: string;
  validationResults: ValidationResult[];
  isDirty: boolean;
  isSimulatorOpen: boolean;
  lastSavedAt?: string;
}

export interface SimulatorMessage {
  id: string;
  role: "bot" | "user" | "system";
  content: string;
}

export interface SimulatorState {
  currentNodeId?: string;
  messages: SimulatorMessage[];
  variables: Record<string, string>;
  awaitingInput: boolean;
  awaitingInputMode?: "question" | "choice";
  pendingQuestionVariable?: string;
  pendingQuestionOptions?: QuestionChoiceOption[];
}
