"use client";

import { createContext } from "react";
import type { Connection, Edge, Node } from "reactflow";
import type {
    BotEdge,
    BotGraph,
    BotNode,
    BuilderState,
    NodeConfig,
    NodeType,
    SimulatorState,
    ValidationResult
} from "../types";

export interface IBuilderStateContext {
    state: BuilderState;
    reactFlowNodes: Node[];
    reactFlowEdges: Edge[];
    selectedNode?: BotNode;
    selectedEdge?: BotEdge;
}

export interface IBuilderActionContext {
    addNode: (nodeType: NodeType, position?: { x: number; y: number }) => void;
    updateNodeConfig: (nodeId: string, config: NodeConfig) => void;
    updateNodeLabel: (nodeId: string, label: string) => void;
    updateBotName: (name: string) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    duplicateNode: (nodeId: string) => void;
    duplicateSelectedNode: () => void;
    deleteNode: (nodeId: string) => void;
    deleteSelectedNode: () => void;
    deleteSelectedEdge: () => void;
    replaceEdges: (edges: BotEdge[]) => void;
    setSelectedNode: (nodeId?: string) => void;
    setSelectedEdge: (edgeId?: string) => void;
    onNodesChange: (nodes: Node[]) => void;
    onConnect: (connection: Connection) => void;
    onEdgesChange: (edges: Edge[]) => void;
    runValidation: () => ValidationResult[];
    setValidationResults: (results: ValidationResult[]) => void;
    markSaved: (graph: BotGraph) => void;
    setSimulatorOpen: (open: boolean) => void;
    resetGraph: (graph: BotGraph) => void;
}

export const INITIAL_ACTION_STATE: IBuilderActionContext = {
    addNode: () => undefined,
    updateNodeConfig: () => undefined,
    updateNodeLabel: () => undefined,
    updateBotName: () => undefined,
    undo: () => undefined,
    redo: () => undefined,
    canUndo: false,
    canRedo: false,
    duplicateNode: () => undefined,
    duplicateSelectedNode: () => undefined,
    deleteNode: () => undefined,
    deleteSelectedNode: () => undefined,
    deleteSelectedEdge: () => undefined,
    replaceEdges: () => undefined,
    setSelectedNode: () => undefined,
    setSelectedEdge: () => undefined,
    onNodesChange: () => undefined,
    onConnect: () => undefined,
    onEdgesChange: () => undefined,
    runValidation: () => [],
    setValidationResults: () => undefined,
    markSaved: () => undefined,
    setSimulatorOpen: () => undefined,
    resetGraph: () => undefined
};

export const BuilderStateContext =
    createContext<IBuilderStateContext | undefined>(undefined);

export const BuilderActionContext =
    createContext<IBuilderActionContext | undefined>(undefined);

export function createInitialState(graph: BotGraph): BuilderState {
    return {
        graph,
        past: [],
        future: [],
        selectedNodeId: graph.nodes[0]?.id,
        validationResults: [],
        isDirty: false,
        isSimulatorOpen: false
    };
}

export interface ISimulatorMessage {
    id: string;
    role: "bot" | "user" | "system";
    content: string;
}

export type { SimulatorState };
