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
    ApiNodeConfig,
    BotEdge,
    BotGraph,
    BotNode,
    CodeNodeConfig,
    NodeConfig,
    NodeType,
    SimulatorMessage,
    SimulatorState,
    VariableNodeConfig,
    ValidationResult
} from "../types";
import { validateBotGraph } from "../validation";
import {
    getVariableOperation,
    interpolateVariableText,
    normalizeApiConfig,
    normalizeCodeConfig,
    normalizeConditionConfig,
    normalizeQuestionConfig
} from "../variable-utils";

interface BuilderProviderProps {
    graph: BotGraph;
    children: ReactNode;
}

/**
 * Provides in-editor builder state separate from persisted bot CRUD workflows.
 */
export function BuilderProvider({ graph, children }: BuilderProviderProps) {
    const [state, dispatch] = useReducer(BuilderReducer, normalizeGraph(graph), createInitialState);

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
        duplicateNode: (nodeId: string) => {
            const nodeToDuplicate = state.graph.nodes.find((node) => node.id === nodeId);

            if (!nodeToDuplicate) {
                return;
            }

            const duplicateNodeId = createNodeId(nodeToDuplicate.type, state.graph.nodes);
            const duplicateNode: BotNode = {
                ...nodeToDuplicate,
                id: duplicateNodeId,
                label: `${nodeToDuplicate.label} Copy`,
                position: {
                    x: nodeToDuplicate.position.x + 48,
                    y: nodeToDuplicate.position.y + 48
                },
                config: cloneNodeConfig(nodeToDuplicate.config)
            };

            dispatch(addNodeAction(duplicateNode));
        },
        duplicateSelectedNode: () => {
            if (!selectedNode) {
                return;
            }

            const duplicateNodeId = createNodeId(selectedNode.type, state.graph.nodes);
            const duplicateNode: BotNode = {
                ...selectedNode,
                id: duplicateNodeId,
                label: `${selectedNode.label} Copy`,
                position: {
                    x: selectedNode.position.x + 48,
                    y: selectedNode.position.y + 48
                },
                config: cloneNodeConfig(selectedNode.config)
            };

            dispatch(addNodeAction(duplicateNode));
        },
        deleteNode: (nodeId: string) => {
            const nodeToDelete = state.graph.nodes.find((node) => node.id === nodeId);

            if (!nodeToDelete || nodeToDelete.type === "start") {
                return;
            }

            dispatch(deleteNodeAction({ id: nodeToDelete.id }));
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
            dispatch(markSavedAction(normalizeGraph(nextGraph)));
        },
        setSimulatorOpen: (open: boolean) => {
            dispatch(setSimulatorOpenAction(open));
        },
        resetGraph: (nextGraph: BotGraph) => {
            dispatch(resetGraphAction(normalizeGraph(nextGraph)));
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
            nodeId: node.id,
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
    if (!sourceNode) {
        return sourceHandle || "Next";
    }

    if (sourceNode.type === "api" && sourceNode.config.kind === "api") {
        if (sourceHandle === "error") {
            return sourceNode.config.errorLabel?.trim() || "Error";
        }

        return sourceNode.config.successLabel?.trim() || "Success";
    }

    if (sourceNode.type !== "condition" || sourceNode.config.kind !== "condition") {
        return sourceHandle || "Next";
    }

    if (sourceHandle === "fallback") {
        return sourceNode.config.fallbackLabel || "Fallback";
    }

    const ruleIndex = Number(sourceHandle?.replace("rule-", ""));
    const rule = sourceNode.config.rules[ruleIndex];

    if (!rule) {
        return "Rule";
    }

    return rule.value.trim() || rule.operator;
}

function getNodeSummary(node: BotNode) {
    switch (node.config.kind) {
        case "start":
            return "Entry point for this conversation flow.";
        case "message":
            return node.config.message.trim() || "Send a fixed message to the user.";
        case "question":
            return (node.config.inputMode ?? "text") === "choice"
                ? `${node.config.question.trim() || "Ask the user to choose an option."} Saves the selection into ${node.config.variableName || "a variable"} from ${(node.config.options ?? []).filter((option) => option.trim().length > 0).length} choice(s).`
                : `${node.config.question.trim() || "Ask for input."} Captures into ${node.config.variableName || "a variable"}.`;
        case "condition": {
            const ruleCount = node.config.rules.length;
            const ruleSummary = ruleCount === 1 ? "1 branch rule" : `${ruleCount} branch rules`;
            const fallbackLabel = node.config.fallbackLabel.trim() || "Fallback";
            return `Checks ${node.config.variableName || "a variable"}. ${ruleSummary} with ${fallbackLabel.toLowerCase()} as the default route.`;
        }
        case "variable":
            return getVariableSummary(node.config);
        case "api":
            return `${node.config.method} ${node.config.endpoint || "endpoint"} with ${(node.config.responseMappings ?? []).length} response mapping(s), ${getApiBranchLabel(node.config.successLabel, "Success")} and ${getApiBranchLabel(node.config.errorLabel, "Error")} routes.`;
        case "ai":
            return node.config.instructions.trim() || "Generate a grounded AI response.";
        case "code":
            return `Compute ${node.config.targetVariable || "a variable"} using ${(node.config.operation ?? "template")} logic.`;
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

function createSystemMessage(content: string): SimulatorMessage {
    return {
        id: `message-${Math.random().toString(36).slice(2, 10)}`,
        role: "system",
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

        if (simulator.awaitingInputMode === "choice" && simulator.pendingQuestionVariable) {
            const matchedChoice = findMatchingQuestionOption(simulator.pendingQuestionOptions ?? [], userInput);

            if (!matchedChoice) {
                nextState.messages.push(createBotMessage(
                    getCurrentQuestionInvalidInputMessage(graph, simulator.currentNodeId)
                ));
                return nextState;
            }

            const outgoing = getOutgoingEdges(graph, simulator.currentNodeId || "");
            return {
                ...nextState,
                variables: {
                    ...nextState.variables,
                    [simulator.pendingQuestionVariable]: matchedChoice
                },
                awaitingInput: false,
                awaitingInputMode: undefined,
                pendingQuestionVariable: undefined,
                pendingQuestionOptions: undefined,
                currentNodeId: outgoing[0]?.target
            };
        }

        if (simulator.awaitingInputMode === "question" && simulator.pendingQuestionVariable) {
            nextState.variables[simulator.pendingQuestionVariable] = userInput;
            const outgoing = getOutgoingEdges(graph, simulator.currentNodeId || "");
            nextState = {
                ...nextState,
                awaitingInput: false,
                awaitingInputMode: undefined,
                pendingQuestionVariable: undefined,
                pendingQuestionOptions: undefined,
                currentNodeId: outgoing[0]?.target
            };
        }
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
            nextState.messages.push(createBotMessage(
                interpolateVariableText(currentNode.config.message, nextState.variables)
            ));
            nextState.currentNodeId = outgoing[0]?.target;
            continue;
        }

        if (currentNode.type === "question" && currentNode.config.kind === "question") {
            nextState.messages.push(createBotMessage(
                interpolateVariableText(currentNode.config.question, nextState.variables)
            ));
            nextState.awaitingInput = true;
            nextState.awaitingInputMode = currentNode.config.inputMode === "choice" ? "choice" : "question";
            nextState.pendingQuestionVariable = currentNode.config.variableName;
            nextState.pendingQuestionOptions = currentNode.config.inputMode === "choice"
                ? (currentNode.config.options ?? []).filter((option) => option.trim().length > 0)
                : undefined;
            break;
        }

        if (currentNode.type === "condition" && currentNode.config.kind === "condition") {
            nextState = resolveConditionVariableMode(
                graph,
                nextState,
                currentNode as BotNode & { config: Extract<NodeConfig, { kind: "condition" }> }
            );
            continue;
        }

        if (currentNode.type === "variable" && currentNode.config.kind === "variable") {
            nextState.variables = applyVariableNode(currentNode.config, nextState.variables);
            nextState.messages.push(createSystemMessage(getVariableSummary(currentNode.config)));
            nextState.currentNodeId = outgoing[0]?.target;
            continue;
        }

        if (currentNode.type === "ai" && currentNode.config.kind === "ai") {
            nextState.messages.push(createBotMessage(
                interpolateVariableText(currentNode.config.fallbackText, nextState.variables)
            ));
            nextState.currentNodeId = outgoing[0]?.target;
            continue;
        }

        if (currentNode.type === "api" && currentNode.config.kind === "api") {
            nextState.variables = applyApiPreview(currentNode.config, nextState.variables);
            nextState.messages.push(createSystemMessage(
                `Preview API call: ${currentNode.config.method} ${currentNode.config.endpoint}. Response mappings were filled with sample values and the ${getApiBranchLabel(currentNode.config.successLabel, "Success").toLowerCase()} route was used.`
            ));
            nextState.currentNodeId = outgoing.find((edge) => edge.sourceHandle === "success")?.target ?? outgoing[0]?.target;
            continue;
        }

        if (currentNode.type === "code" && currentNode.config.kind === "code") {
            nextState.variables = applyCodeNode(currentNode.config, nextState.variables);
            nextState.messages.push(createSystemMessage(
                getCodeSummary(currentNode.config, nextState.variables)
            ));
            nextState.currentNodeId = outgoing[0]?.target;
            continue;
        }

        if (currentNode.type === "handoff" && currentNode.config.kind === "handoff") {
            nextState.messages.push(createBotMessage(
                `Connecting you to ${currentNode.config.queueName || "a human agent"}.`
            ));
            nextState.currentNodeId = undefined;
            break;
        }

        if (currentNode.type === "end" && currentNode.config.kind === "end") {
            if (currentNode.config.closingText) {
                nextState.messages.push(createBotMessage(
                    interpolateVariableText(currentNode.config.closingText, nextState.variables)
                ));
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

function cloneNodeConfig<TConfig extends NodeConfig>(config: TConfig): TConfig {
    return JSON.parse(JSON.stringify(config)) as TConfig;
}

function getVariableSummary(config: VariableNodeConfig): string {
    const variableName = config.variableName || "a variable";

    switch (getVariableOperation(config)) {
        case "append":
            return `Append ${config.value || "a value"} to ${variableName}.`;
        case "clear":
            return `Clear ${variableName}.`;
        case "copy":
            return `Copy ${config.sourceVariableName || "another variable"} into ${variableName}.`;
        case "set":
        default:
            return `Set ${variableName} to ${config.value || "a value"}.`;
    }
}

function applyVariableNode(
    config: VariableNodeConfig,
    variables: Record<string, string>
): Record<string, string> {
    const nextVariables = { ...variables };
    const variableName = config.variableName.trim();

    if (!variableName) {
        return nextVariables;
    }

    switch (getVariableOperation(config)) {
        case "append":
            nextVariables[variableName] = `${nextVariables[variableName] ?? ""}${interpolateVariableText(config.value, variables)}`;
            return nextVariables;
        case "clear":
            nextVariables[variableName] = "";
            return nextVariables;
        case "copy":
            nextVariables[variableName] = variables[config.sourceVariableName?.trim() ?? ""] ?? "";
            return nextVariables;
        case "set":
        default:
            nextVariables[variableName] = interpolateVariableText(config.value, variables);
            return nextVariables;
    }
}

function resolveConditionVariableMode(
    graph: BotGraph,
    simulator: SimulatorState,
    node: BotNode & { config: Extract<NodeConfig, { kind: "condition" }> }
): SimulatorState {
    const variableValue = simulator.variables[node.config.variableName?.trim() ?? ""] ?? "";
    const outgoing = getOutgoingEdges(graph, node.id);
    const matchedIndex = node.config.rules.findIndex((rule) => matchesConditionRule(variableValue, rule.value, rule.operator));
    const chosenHandle = matchedIndex >= 0 ? `rule-${matchedIndex}` : "fallback";
    const chosenEdge = outgoing.find((edge) => edge.sourceHandle === chosenHandle) || outgoing[0];

    return {
        ...simulator,
        messages: matchedIndex >= 0
            ? simulator.messages
            : [
                ...simulator.messages,
                createSystemMessage(`No rule matched ${node.config.variableName || "the selected variable"}. Using the fallback route.`)
            ],
        awaitingInput: false,
        awaitingInputMode: undefined,
        pendingQuestionVariable: undefined,
        pendingQuestionOptions: undefined,
        currentNodeId: chosenEdge?.target
    };
}

function matchesConditionRule(
    inputValue: string,
    ruleValue: string,
    operator: "equals" | "contains" | "startsWith" | "endsWith" | "isEmpty" | "isNotEmpty"
): boolean {
    const normalizedInput = inputValue.toLowerCase();
    const normalizedRuleValue = ruleValue.toLowerCase();

    switch (operator) {
        case "contains":
            return normalizedInput.includes(normalizedRuleValue);
        case "startsWith":
            return normalizedInput.startsWith(normalizedRuleValue);
        case "endsWith":
            return normalizedInput.endsWith(normalizedRuleValue);
        case "isEmpty":
            return normalizedInput.trim().length === 0;
        case "isNotEmpty":
            return normalizedInput.trim().length > 0;
        case "equals":
        default:
            return normalizedInput === normalizedRuleValue;
    }
}

function normalizeGraph(graph: BotGraph): BotGraph {
    return {
        ...graph,
        nodes: graph.nodes.map((node) => {
            if (node.config.kind === "question") {
                return {
                    ...node,
                    config: normalizeQuestionConfig(node.config)
                };
            }

            if (node.config.kind === "code") {
                return {
                    ...node,
                    config: normalizeCodeConfig(node.config)
                };
            }

            if (node.config.kind === "api") {
                return {
                    ...node,
                    config: normalizeApiConfig(node.config)
                };
            }

            if (node.config.kind !== "condition") {
                return node;
            }

            return {
                ...node,
                config: normalizeConditionConfig(node.config)
            };
        })
    };
}

function findMatchingQuestionOption(options: string[], userInput: string): string | undefined {
    const normalizedInput = userInput.trim().toLowerCase();

    return options.find((option) => option.trim().toLowerCase() === normalizedInput);
}

function getCurrentQuestionInvalidInputMessage(graph: BotGraph, nodeId?: string): string {
    const currentNode = graph.nodes.find((node) => node.id === nodeId);

    if (currentNode?.config.kind !== "question") {
        return "Please choose one of the available options.";
    }

    return currentNode.config.invalidInputMessage?.trim() || "Please choose one of the available options.";
}

function applyCodeNode(
    config: CodeNodeConfig,
    variables: Record<string, string>
): Record<string, string> {
    const nextVariables = { ...variables };
    const targetVariable = config.targetVariable.trim();

    if (!targetVariable) {
        return nextVariables;
    }

    nextVariables[targetVariable] = executeCodeOperation(config, variables);
    return nextVariables;
}

function executeCodeOperation(
    config: CodeNodeConfig,
    variables: Record<string, string>
): string {
    const primaryInput = interpolateVariableText(config.input, variables);
    const secondInput = interpolateVariableText(config.secondInput ?? "", variables);

    switch (config.operation ?? "template") {
        case "lowercase":
            return primaryInput.toLowerCase();
        case "uppercase":
            return primaryInput.toUpperCase();
        case "trim":
            return primaryInput.trim();
        case "concat":
            return `${primaryInput}${secondInput}`;
        case "template":
        default:
            return primaryInput;
    }
}

function getCodeSummary(
    config: CodeNodeConfig,
    variables: Record<string, string>
): string {
    return `Computed ${config.targetVariable || "a variable"} = ${executeCodeOperation(config, variables) || "(empty value)"}.`;
}

function getApiBranchLabel(label: string | undefined, fallback: string): string {
    return label?.trim() || fallback;
}

function applyApiPreview(
    config: ApiNodeConfig,
    variables: Record<string, string>
): Record<string, string> {
    const nextVariables = { ...variables };

    (config.responseMappings ?? []).forEach((mapping) => {
        const variableName = mapping.variableName.trim();

        if (!variableName) {
            return;
        }

        nextVariables[variableName] = `preview:${mapping.path || "body"}`;
    });

    return nextVariables;
}
