"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import type { Connection, Edge, Node } from "reactflow";
import { addEdge } from "reactflow";
import { getMockGraph } from "./mock-data";
import { nodeRegistry } from "./node-registry";
import type {
  BotEdge,
  BotGraph,
  BotNode,
  BuilderState,
  NodeConfig,
  NodeType,
  SimulatorMessage,
  SimulatorState,
  ValidationResult,
} from "./types";
import { validateBotGraph } from "./validation";

type BuilderAction =
  | { type: "selectNode"; payload?: string }
  | { type: "selectEdge"; payload?: string }
  | { type: "addNode"; payload: BotNode }
  | { type: "updateNode"; payload: { id: string; node: Partial<BotNode> } }
  | { type: "deleteNode"; payload: { id: string } }
  | { type: "setNodes"; payload: BotNode[] }
  | { type: "setEdges"; payload: BotEdge[] }
  | { type: "deleteSelectedEdge" }
  | { type: "setValidationResults"; payload: ValidationResult[] }
  | { type: "markSaved" }
  | { type: "setSimulatorOpen"; payload: boolean };

interface BuilderContextValue {
  state: BuilderState;
  reactFlowNodes: Node[];
  reactFlowEdges: Edge[];
  addNode: (nodeType: NodeType, position?: { x: number; y: number }) => void;
  updateNodeConfig: (nodeId: string, config: NodeConfig) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  deleteSelectedNode: () => void;
  deleteSelectedEdge: () => void;
  setSelectedNode: (nodeId?: string) => void;
  setSelectedEdge: (edgeId?: string) => void;
  onNodesChange: (nodes: Node[]) => void;
  onConnect: (connection: Connection) => void;
  onEdgesChange: (edges: Edge[]) => void;
  runValidation: () => ValidationResult[];
  saveGraph: () => void;
  setSimulatorOpen: (open: boolean) => void;
  selectedNode?: BotNode;
  selectedEdge?: BotEdge;
}

interface BuilderProviderProps {
  botId?: string;
  children: ReactNode;
}

const BuilderContext = createContext<BuilderContextValue | undefined>(undefined);

function createInitialState(botId?: string): BuilderState {
  const graph = getMockGraph(botId);

  return {
    graph,
    selectedNodeId: graph.nodes[0]?.id,
    validationResults: [],
    isDirty: false,
    isSimulatorOpen: false,
  };
}

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "selectNode":
      return { ...state, selectedNodeId: action.payload, selectedEdgeId: undefined };
    case "selectEdge":
      return { ...state, selectedEdgeId: action.payload, selectedNodeId: undefined };
    case "addNode":
      return {
        ...state,
        graph: { ...state.graph, nodes: [...state.graph.nodes, action.payload] },
        selectedNodeId: action.payload.id,
        selectedEdgeId: undefined,
        isDirty: true,
      };
    case "updateNode":
      return {
        ...state,
        graph: {
          ...state.graph,
          nodes: state.graph.nodes.map((node) =>
            node.id === action.payload.id ? { ...node, ...action.payload.node } : node,
          ),
        },
        isDirty: true,
      };
    case "deleteNode": {
      const nextNodes = state.graph.nodes.filter((node) => node.id !== action.payload.id);
      const nextEdges = state.graph.edges.filter(
        (edge) => edge.source !== action.payload.id && edge.target !== action.payload.id,
      );

      return {
        ...state,
        graph: { ...state.graph, nodes: nextNodes, edges: nextEdges },
        selectedNodeId: nextNodes[0]?.id,
        selectedEdgeId: undefined,
        isDirty: true,
      };
    }
    case "setNodes":
      return {
        ...state,
        graph: { ...state.graph, nodes: action.payload },
        isDirty: true,
      };
    case "setEdges":
      return {
        ...state,
        graph: { ...state.graph, edges: action.payload },
        isDirty: true,
      };
    case "deleteSelectedEdge":
      return {
        ...state,
        graph: {
          ...state.graph,
          edges: state.graph.edges.filter((edge) => edge.id !== state.selectedEdgeId),
        },
        selectedEdgeId: undefined,
        isDirty: true,
      };
    case "setValidationResults":
      return { ...state, validationResults: action.payload };
    case "markSaved":
      return {
        ...state,
        isDirty: false,
        lastSavedAt: new Date().toISOString(),
        graph: {
          ...state.graph,
          metadata: { ...state.graph.metadata, status: "saved" },
        },
      };
    case "setSimulatorOpen":
      return { ...state, isSimulatorOpen: action.payload };
    default:
      return state;
  }
}

function toReactFlowNode(node: BotNode, isSelected: boolean): Node {
  return {
    id: node.id,
    type: "botNode",
    position: node.position,
    data: {
      label: node.label,
      nodeType: node.type,
      definition: nodeRegistry[node.type],
      isSelected,
    },
  };
}

function toReactFlowEdge(edge: BotEdge, isSelected: boolean): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    label: edge.label,
    selected: isSelected,
    style: {
      strokeWidth: isSelected ? 2.8 : 2,
      stroke: isSelected ? "#111111" : "#CBD5E1",
    },
    labelStyle: {
      fill: "#6B7280",
      fontSize: 12,
      fontWeight: 600,
    },
  };
}

function createNodeId(nodeType: NodeType, nodes: BotNode[]) {
  return `${nodeType}-${nodes.filter((node) => node.type === nodeType).length + 1}`;
}

function findEdgeLabel(sourceNode?: BotNode, sourceHandle?: string) {
  if (!sourceNode || sourceNode.type !== "condition" || sourceNode.config.kind !== "condition") {
    return sourceHandle ?? "Next";
  }

  if (sourceHandle === "fallback") {
    return sourceNode.config.fallbackLabel || "Fallback";
  }

  const ruleIndex = Number(sourceHandle?.replace("rule-", ""));
  return sourceNode.config.rules[ruleIndex]?.value || "Rule";
}

export function BuilderProvider({ botId, children }: BuilderProviderProps) {
  const [state, dispatch] = useReducer(builderReducer, undefined, () =>
    createInitialState(botId),
  );

  const reactFlowNodes = useMemo(
    () =>
      state.graph.nodes.map((node) =>
        toReactFlowNode(node, state.selectedNodeId === node.id),
      ),
    [state.graph.nodes, state.selectedNodeId],
  );

  const reactFlowEdges = useMemo(
    () =>
      state.graph.edges.map((edge) =>
        toReactFlowEdge(edge, state.selectedEdgeId === edge.id),
      ),
    [state.graph.edges, state.selectedEdgeId],
  );

  const selectedNode = useMemo(
    () => state.graph.nodes.find((node) => node.id === state.selectedNodeId),
    [state.graph.nodes, state.selectedNodeId],
  );

  const selectedEdge = useMemo(
    () => state.graph.edges.find((edge) => edge.id === state.selectedEdgeId),
    [state.graph.edges, state.selectedEdgeId],
  );

  const addNode = useCallback(
    (nodeType: NodeType, position?: { x: number; y: number }) => {
      const definition = nodeRegistry[nodeType];
      const nodeId = createNodeId(nodeType, state.graph.nodes);
      const nextPosition = position ?? {
        x: 140 + (state.graph.nodes.length % 3) * 220,
        y: 140 + state.graph.nodes.length * 90,
      };

      dispatch({
        type: "addNode",
        payload: {
          id: nodeId,
          type: nodeType,
          label: definition.label,
          position: nextPosition,
          config: definition.defaultConfig(),
        },
      });
    },
    [state.graph.nodes],
  );

  const updateNodeConfig = useCallback((nodeId: string, config: NodeConfig) => {
    dispatch({ type: "updateNode", payload: { id: nodeId, node: { config } } });
  }, []);

  const updateNodeLabel = useCallback((nodeId: string, label: string) => {
    dispatch({ type: "updateNode", payload: { id: nodeId, node: { label } } });
  }, []);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode || selectedNode.type === "start") {
      return;
    }

    dispatch({ type: "deleteNode", payload: { id: selectedNode.id } });
  }, [selectedNode]);

  const deleteSelectedEdge = useCallback(() => {
    dispatch({ type: "deleteSelectedEdge" });
  }, []);

  const setSelectedNode = useCallback((nodeId?: string) => {
    dispatch({ type: "selectNode", payload: nodeId });
  }, []);

  const setSelectedEdge = useCallback((edgeId?: string) => {
    dispatch({ type: "selectEdge", payload: edgeId });
  }, []);

  const onNodesChange = useCallback(
    (nodes: Node[]) => {
      const nextNodes = nodes
        .map((node) => {
          const existingNode = state.graph.nodes.find((graphNode) => graphNode.id === node.id);
          return existingNode ? { ...existingNode, position: node.position } : undefined;
        })
        .filter((node): node is BotNode => Boolean(node));

      dispatch({ type: "setNodes", payload: nextNodes });
    },
    [state.graph.nodes],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        return;
      }

      const sourceNode = state.graph.nodes.find((node) => node.id === connection.source);
      const candidateEdge = {
        id: `edge-${connection.source}-${connection.sourceHandle ?? "default"}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? undefined,
        label: findEdgeLabel(sourceNode, connection.sourceHandle ?? undefined),
      };

      const reactFlowCandidate = addEdge(candidateEdge, reactFlowEdges);

      dispatch({
        type: "setEdges",
        payload: reactFlowCandidate.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle ?? undefined,
          label: typeof edge.label === "string" ? edge.label : undefined,
        })),
      });
    },
    [reactFlowEdges, state.graph.nodes],
  );

  const onEdgesChange = useCallback((edges: Edge[]) => {
    dispatch({
      type: "setEdges",
      payload: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle ?? undefined,
        label: typeof edge.label === "string" ? edge.label : undefined,
      })),
    });
  }, []);

  const runValidation = useCallback(() => {
    const results = validateBotGraph(state.graph);
    dispatch({ type: "setValidationResults", payload: results });
    return results;
  }, [state.graph]);

  const saveGraph = useCallback(() => {
    dispatch({ type: "markSaved" });
  }, []);

  const setSimulatorOpen = useCallback((open: boolean) => {
    dispatch({ type: "setSimulatorOpen", payload: open });
  }, []);

  const value = useMemo<BuilderContextValue>(
    () => ({
      state,
      reactFlowNodes,
      reactFlowEdges,
      addNode,
      updateNodeConfig,
      updateNodeLabel,
      deleteSelectedNode,
      deleteSelectedEdge,
      setSelectedNode,
      setSelectedEdge,
      onNodesChange,
      onConnect,
      onEdgesChange,
      runValidation,
      saveGraph,
      setSimulatorOpen,
      selectedNode,
      selectedEdge,
    }),
    [
      state,
      reactFlowNodes,
      reactFlowEdges,
      addNode,
      updateNodeConfig,
      updateNodeLabel,
      deleteSelectedNode,
      deleteSelectedEdge,
      setSelectedNode,
      setSelectedEdge,
      onNodesChange,
      onConnect,
      onEdgesChange,
      runValidation,
      saveGraph,
      setSimulatorOpen,
      selectedNode,
      selectedEdge,
    ],
  );

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

export function useBuilder() {
  const context = useContext(BuilderContext);

  if (!context) {
    throw new Error("useBuilder must be used within a BuilderProvider");
  }

  return context;
}

function getOutgoingEdges(graph: BotGraph, nodeId: string) {
  return graph.edges.filter((edge) => edge.source === nodeId);
}

function createBotMessage(content: string): SimulatorMessage {
  return {
    id: `message-${Math.random().toString(36).slice(2, 10)}`,
    role: "bot",
    content,
  };
}

function createUserMessage(content: string): SimulatorMessage {
  return {
    id: `message-${Math.random().toString(36).slice(2, 10)}`,
    role: "user",
    content,
  };
}

export function createInitialSimulatorState(graph: BotGraph): SimulatorState {
  const startNode = graph.nodes.find((node) => node.type === "start");

  if (!startNode) {
    return {
      currentNodeId: undefined,
      messages: [createBotMessage("This bot is invalid because it has no start node.")],
      variables: {},
      awaitingInput: false,
    };
  }

  return advanceSimulator(
    graph,
    {
      currentNodeId: startNode.id,
      messages: [],
      variables: {},
      awaitingInput: false,
    },
    undefined,
  );
}

export function advanceSimulator(
  graph: BotGraph,
  simulator: SimulatorState,
  userInput?: string,
): SimulatorState {
  let nextState: SimulatorState = {
    ...simulator,
    messages: [...simulator.messages],
    variables: { ...simulator.variables },
  };

  if (userInput && simulator.awaitingInput) {
    nextState.messages.push(createUserMessage(userInput));

    if (simulator.pendingQuestionVariable) {
      nextState.variables[simulator.pendingQuestionVariable] = userInput;
    }

    const outgoing = getOutgoingEdges(graph, simulator.currentNodeId ?? "");
    nextState = {
      ...nextState,
      awaitingInput: false,
      pendingQuestionVariable: undefined,
      currentNodeId: outgoing[0]?.target,
    };
  }

  let safetyCounter = 0;

  while (!nextState.awaitingInput && nextState.currentNodeId && safetyCounter < 20) {
    safetyCounter += 1;
    const currentNode = graph.nodes.find((node) => node.id === nextState.currentNodeId);

    if (!currentNode) {
      break;
    }

    const outgoing = getOutgoingEdges(graph, currentNode.id);

    if (currentNode.type === "start") {
      nextState.currentNodeId = outgoing[0]?.target;
      continue;
    }

    if (currentNode.type === "message" && currentNode.config.kind === "message") {
      nextState.messages.push(createBotMessage(currentNode.config.message));
      nextState.currentNodeId = outgoing[0]?.target;
      continue;
    }

    if (currentNode.type === "question" && currentNode.config.kind === "question") {
      nextState.messages.push(createBotMessage(currentNode.config.question));
      nextState.awaitingInput = true;
      nextState.pendingQuestionVariable = currentNode.config.variableName;
      break;
    }

    if (currentNode.type === "condition" && currentNode.config.kind === "condition") {
      const value = nextState.variables.intent ?? nextState.variables.userIntent ?? "";
      const matchedIndex = currentNode.config.rules.findIndex((rule) => {
        if (rule.operator === "contains") {
          return value.toLowerCase().includes(rule.value.toLowerCase());
        }

        return value.toLowerCase() === rule.value.toLowerCase();
      });

      const chosenHandle = matchedIndex >= 0 ? `rule-${matchedIndex}` : "fallback";
      const chosenEdge =
        outgoing.find((edge) => edge.sourceHandle === chosenHandle) ?? outgoing[0];

      if (matchedIndex < 0) {
        nextState.messages.push(
          createBotMessage(
            `No direct match was found. Taking the ${currentNode.config.fallbackLabel.toLowerCase()} route.`,
          ),
        );
      }

      nextState.currentNodeId = chosenEdge?.target;
      continue;
    }

    if (currentNode.type === "ai" && currentNode.config.kind === "ai") {
      nextState.messages.push(createBotMessage(currentNode.config.fallbackText));
      nextState.currentNodeId = outgoing[0]?.target;
      continue;
    }

    if (currentNode.type === "end" && currentNode.config.kind === "end") {
      if (currentNode.config.closingText) {
        nextState.messages.push(createBotMessage(currentNode.config.closingText));
      }
      nextState.currentNodeId = undefined;
      break;
    }

    nextState.messages.push(
      createBotMessage(`${currentNode.label} is configured as a placeholder node in this MVP.`),
    );
    nextState.currentNodeId = outgoing[0]?.target;
  }

  return nextState;
}
