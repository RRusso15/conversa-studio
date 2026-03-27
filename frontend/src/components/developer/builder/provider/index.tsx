"use client";

import { useContext, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import type { Connection, Edge, Node } from "reactflow";
import { addEdge, MarkerType } from "reactflow";
import {
    addNode as addNodeAction,
    deleteNode as deleteNodeAction,
    deleteSelectedEdge as deleteSelectedEdgeAction,
    markSaved as markSavedAction,
    resetGraph as resetGraphAction,
    selectEdge as selectEdgeAction,
    selectNode as selectNodeAction,
    setEdges as setEdgesAction,
    setNodes as setNodesAction,
    setSimulatorOpen as setSimulatorOpenAction,
    setValidationResults as setValidationResultsAction,
    updateMetadata as updateMetadataAction,
    updateNode as updateNodeAction
} from "./actions";
import {
    BuilderActionContext,
    BuilderStateContext,
    createInitialState,
    INITIAL_ACTION_STATE,
    type IBuilderActionContext,
    type IBuilderStateContext
} from "./context";
import { BuilderReducer } from "./reducer";
import { nodeRegistry } from "../node-registry";
import type {
    BotEdge,
    BotGraph,
    BotNode,
    NodeConfig,
    NodeType,
    SimulatorMessage,
    SimulatorState,
    ValidationResult
} from "../types";
import { validateBotGraph } from "../validation";

interface BuilderProviderProps {
    graph: BotGraph;
    children: ReactNode;
}

/**
 * Provides in-editor builder state separate from persisted bot CRUD workflows.
 */
export function BuilderProvider({ graph, children }: BuilderProviderProps) {
    const [state, dispatch] = useReducer(BuilderReducer, graph, createInitialState);

    const reactFlowNodes = useMemo(
        () =>
            state.graph.nodes.map((node) =>
                toReactFlowNode(node, state.selectedNodeId === node.id)
            ),
        [state.graph.nodes, state.selectedNodeId]
    );

    const reactFlowEdges = useMemo(
        () =>
            state.graph.edges.map((edge) =>
                toReactFlowEdge(edge, state.selectedEdgeId === edge.id)
            ),
        [state.graph.edges, state.selectedEdgeId]
    );

    const selectedNode = useMemo(
        () => state.graph.nodes.find((node) => node.id === state.selectedNodeId),
        [state.graph.nodes, state.selectedNodeId]
    );

    const selectedEdge = useMemo(
        () => state.graph.edges.find((edge) => edge.id === state.selectedEdgeId),
        [state.graph.edges, state.selectedEdgeId]
    );

    const actions = useMemo<IBuilderActionContext>(() => ({
        ...INITIAL_ACTION_STATE,
        addNode: (nodeType: NodeType, position?: { x: number; y: number }) => {
            const definition = nodeRegistry[nodeType];
            const nodeId = createNodeId(nodeType, state.graph.nodes);
            const nextPosition = position ?? {
                x: 140 + (state.graph.nodes.length % 3) * 220,
                y: 140 + state.graph.nodes.length * 90
            };

            dispatch(addNodeAction({
                id: nodeId,
                type: nodeType,
                label: definition.label,
                position: nextPosition,
                config: definition.defaultConfig()
            }));
        },
        updateNodeConfig: (nodeId: string, config: NodeConfig) => {
            dispatch(updateNodeAction({ id: nodeId, node: { config } }));
        },
        updateNodeLabel: (nodeId: string, label: string) => {
            dispatch(updateNodeAction({ id: nodeId, node: { label } }));
        },
        updateBotName: (name: string) => {
            dispatch(updateMetadataAction({ name }));
        },
        deleteSelectedNode: () => {
            if (!selectedNode || selectedNode.type === "start") {
                return;
            }

            dispatch(deleteNodeAction({ id: selectedNode.id }));
        },
        deleteSelectedEdge: () => {
            dispatch(deleteSelectedEdgeAction());
        },
        setSelectedNode: (nodeId?: string) => {
            dispatch(selectNodeAction(nodeId));
        },
        setSelectedEdge: (edgeId?: string) => {
            dispatch(selectEdgeAction(edgeId));
        },
        onNodesChange: (nodes: Node[]) => {
            const nextNodes = nodes
                .map((node) => {
                    const existingNode = state.graph.nodes.find((graphNode) => graphNode.id === node.id);
                    return existingNode ? { ...existingNode, position: node.position } : undefined;
                })
                .filter((node): node is BotNode => Boolean(node));

            dispatch(setNodesAction(nextNodes));
        },
        onConnect: (connection: Connection) => {
            if (!connection.source || !connection.target) {
                return;
            }

            const sourceNode = state.graph.nodes.find((node) => node.id === connection.source);
            const candidateEdge = {
                id: `edge-${connection.source}-${connection.sourceHandle ?? "default"}-${connection.target}`,
                source: connection.source,
                target: connection.target,
                sourceHandle: connection.sourceHandle ?? "",
                label: findEdgeLabel(sourceNode, connection.sourceHandle ?? "")
            };

            const reactFlowCandidate = addEdge(candidateEdge, reactFlowEdges);

            dispatch(setEdgesAction(reactFlowCandidate.map((edge) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle ?? "",
                label: typeof edge.label === "string" ? edge.label : ""
            }))));
        },
        onEdgesChange: (edges: Edge[]) => {
            dispatch(setEdgesAction(edges.map((edge) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle ?? "",
                label: typeof edge.label === "string" ? edge.label : ""
            }))));
        },
        runValidation: () => {
            const results = validateBotGraph(state.graph);
            dispatch(setValidationResultsAction(results));
            return results;
        },
        setValidationResults: (results: ValidationResult[]) => {
            dispatch(setValidationResultsAction(results));
        },
        markSaved: (nextGraph: BotGraph) => {
            dispatch(markSavedAction(nextGraph));
        },
        setSimulatorOpen: (open: boolean) => {
            dispatch(setSimulatorOpenAction(open));
        },
        resetGraph: (nextGraph: BotGraph) => {
            dispatch(resetGraphAction(nextGraph));
        }
    }), [reactFlowEdges, selectedNode, state.graph, state.graph.nodes]);

    const value = useMemo<IBuilderStateContext>(() => ({
        state,
        reactFlowNodes,
        reactFlowEdges,
        selectedNode,
        selectedEdge
    }), [reactFlowEdges, reactFlowNodes, selectedEdge, selectedNode, state]);

    return (
        <BuilderStateContext.Provider value={value}>
            <BuilderActionContext.Provider value={actions}>
                {children}
            </BuilderActionContext.Provider>
        </BuilderStateContext.Provider>
    );
}

/**
 * Reads builder state.
 */
export function useBuilderState() {
    const context = useContext(BuilderStateContext);

    if (!context) {
        throw new Error("useBuilderState must be used within a BuilderProvider");
    }

    return context;
}

/**
 * Reads builder actions.
 */
export function useBuilderActions() {
    const context = useContext(BuilderActionContext);

    if (!context) {
        throw new Error("useBuilderActions must be used within a BuilderProvider");
    }

    return context;
}

/**
 * Exposes a convenience hook for builder consumers that need both state and actions.
 */
export function useBuilder() {
    return {
        ...useBuilderState(),
        ...useBuilderActions()
    };
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
            config: node.config,
            summary: getNodeSummary(node),
            isSelected
        }
    };
}

function toReactFlowEdge(edge: BotEdge, isSelected: boolean): Edge {
    return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || undefined,
        label: edge.label || undefined,
        selected: isSelected,
        type: "smoothstep",
        animated: isSelected,
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 18,
            height: 18,
            color: isSelected ? "#0f172a" : "#94a3b8"
        },
        style: {
            strokeWidth: isSelected ? 2.8 : 2,
            stroke: isSelected ? "#0f172a" : "#94A3B8"
        },
        labelStyle: {
            fill: "#334155",
            fontSize: 11,
            fontWeight: 600
        },
        labelBgStyle: {
            fill: "#ffffff",
            fillOpacity: 0.95,
            stroke: "#e2e8f0",
            strokeWidth: 1,
            rx: 8,
            ry: 8
        },
        labelBgPadding: [8, 4],
        labelShowBg: Boolean(edge.label)
    };
}

function createNodeId(nodeType: NodeType, nodes: BotNode[]) {
    return `${nodeType}-${nodes.filter((node) => node.type === nodeType).length + 1}`;
}

function findEdgeLabel(sourceNode?: BotNode, sourceHandle?: string) {
    if (!sourceNode || sourceNode.type !== "condition" || sourceNode.config.kind !== "condition") {
        return sourceHandle || "Next";
    }

    if (sourceHandle === "fallback") {
        return sourceNode.config.fallbackLabel || "Fallback";
    }

    const ruleIndex = Number(sourceHandle?.replace("rule-", ""));
    return sourceNode.config.rules[ruleIndex]?.value || "Rule";
}

function getNodeSummary(node: BotNode) {
    switch (node.config.kind) {
        case "start":
            return "Entry point for this conversation flow.";
        case "message":
            return node.config.message.trim() || "Send a fixed message to the user.";
        case "question":
            return `${node.config.question.trim() || "Ask for input."} Captures into ${node.config.variableName || "a variable"}.`;
        case "condition": {
            const ruleCount = node.config.rules.length;
            const ruleSummary = ruleCount === 1 ? "1 branch rule" : `${ruleCount} branch rules`;
            const fallbackLabel = node.config.fallbackLabel.trim() || "Fallback";
            return `${ruleSummary} with ${fallbackLabel.toLowerCase()} as the default route.`;
        }
        case "variable":
            return `Set ${node.config.variableName || "a variable"} to ${node.config.value || "a value"}.`;
        case "api":
            return `${node.config.method} ${node.config.endpoint}`;
        case "ai":
            return node.config.instructions.trim() || "Generate a grounded AI response.";
        case "code":
            return "Run custom logic before moving to the next step.";
        case "handoff":
            return `Route the conversation to ${node.config.queueName || "a live team"}.`;
        case "end":
            return node.config.closingText.trim() || "End the conversation.";
        default:
            return nodeRegistry[node.type].description;
    }
}

function getOutgoingEdges(graph: BotGraph, nodeId: string) {
    return graph.edges.filter((edge) => edge.source === nodeId);
}

function createBotMessage(content: string): SimulatorMessage {
    return {
        id: `message-${Math.random().toString(36).slice(2, 10)}`,
        role: "bot",
        content
    };
}

function createUserMessage(content: string): SimulatorMessage {
    return {
        id: `message-${Math.random().toString(36).slice(2, 10)}`,
        role: "user",
        content
    };
}

export function createInitialSimulatorState(graph: BotGraph): SimulatorState {
    const startNode = graph.nodes.find((node) => node.type === "start");

    if (!startNode) {
        return {
            currentNodeId: undefined,
            messages: [createBotMessage("This bot is invalid because it has no start node.")],
            variables: {},
            awaitingInput: false
        };
    }

    return advanceSimulator(
        graph,
        {
            currentNodeId: startNode.id,
            messages: [],
            variables: {},
            awaitingInput: false
        },
        undefined
    );
}

export function advanceSimulator(
    graph: BotGraph,
    simulator: SimulatorState,
    userInput?: string
): SimulatorState {
    let nextState: SimulatorState = {
        ...simulator,
        messages: [...simulator.messages],
        variables: { ...simulator.variables }
    };

    if (userInput && simulator.awaitingInput) {
        nextState.messages.push(createUserMessage(userInput));

        if (simulator.pendingQuestionVariable) {
            nextState.variables[simulator.pendingQuestionVariable] = userInput;
        }

        const outgoing = getOutgoingEdges(graph, simulator.currentNodeId || "");
        nextState = {
            ...nextState,
            awaitingInput: false,
            pendingQuestionVariable: undefined,
            currentNodeId: outgoing[0]?.target
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
            const value = nextState.variables.intent || nextState.variables.userIntent || "";
            const matchedIndex = currentNode.config.rules.findIndex((rule) => {
                if (rule.operator === "contains") {
                    return value.toLowerCase().includes(rule.value.toLowerCase());
                }

                return value.toLowerCase() === rule.value.toLowerCase();
            });

            const chosenHandle = matchedIndex >= 0 ? `rule-${matchedIndex}` : "fallback";
            const chosenEdge =
                outgoing.find((edge) => edge.sourceHandle === chosenHandle) || outgoing[0];

            if (matchedIndex < 0) {
                nextState.messages.push(
                    createBotMessage(
                        `No direct match was found. Taking the ${currentNode.config.fallbackLabel.toLowerCase()} route.`
                    )
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
            createBotMessage(`${currentNode.label} is configured as a placeholder node in this MVP.`)
        );
        nextState.currentNodeId = outgoing[0]?.target;
    }

    return nextState;
}
