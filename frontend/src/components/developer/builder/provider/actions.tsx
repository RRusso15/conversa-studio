"use client";

import { createAction } from "redux-actions";
import type { BotEdge, BotGraph, BotNode, BuilderState, ValidationResult } from "../types";

export enum BuilderActionEnums {
    selectNode = "SELECT_NODE",
    selectEdge = "SELECT_EDGE",
    addNode = "ADD_NODE",
    updateNode = "UPDATE_NODE",
    updateMetadata = "UPDATE_METADATA",
    undo = "UNDO",
    redo = "REDO",
    deleteNode = "DELETE_NODE",
    setNodes = "SET_NODES",
    setEdges = "SET_EDGES",
    deleteSelectedEdge = "DELETE_SELECTED_EDGE",
    setValidationResults = "SET_VALIDATION_RESULTS",
    markSaved = "MARK_GRAPH_SAVED",
    setSimulatorOpen = "SET_SIMULATOR_OPEN",
    resetGraph = "RESET_GRAPH"
}

export const selectNode = createAction<Partial<BuilderState>, string | undefined>(
    BuilderActionEnums.selectNode,
    (selectedNodeId) => ({
        selectedNodeId,
        selectedEdgeId: undefined
    })
);

export const selectEdge = createAction<Partial<BuilderState>, string | undefined>(
    BuilderActionEnums.selectEdge,
    (selectedEdgeId) => ({
        selectedEdgeId,
        selectedNodeId: undefined
    })
);

export const addNode = createAction<Partial<BuilderState>, BotNode>(
    BuilderActionEnums.addNode,
    (newNode) => ({
        selectedNodeId: newNode.id,
        selectedEdgeId: undefined,
        isDirty: true,
        newNode
    })
) as unknown as (newNode: BotNode) => {
    type: string;
    payload: Partial<BuilderState> & { newNode: BotNode };
};

export const updateNode = createAction<Partial<BuilderState>, { id: string; node: Partial<BotNode> }>(
    BuilderActionEnums.updateNode,
    (payload) => ({
        graph: undefined,
        isDirty: true,
        ...payload
    })
) as unknown as (payload: { id: string; node: Partial<BotNode> }) => {
    type: string;
    payload: Partial<BuilderState> & { id: string; node: Partial<BotNode> };
};

export const updateMetadata = createAction<Partial<BuilderState>, Partial<BotGraph["metadata"]>>(
    BuilderActionEnums.updateMetadata,
    (metadata) => ({
        graph: undefined,
        isDirty: true,
        metadata
    })
) as unknown as (metadata: Partial<BotGraph["metadata"]>) => {
    type: string;
    payload: Partial<BuilderState> & { metadata: Partial<BotGraph["metadata"]> };
};

export const undo = createAction<Partial<BuilderState>>(
    BuilderActionEnums.undo,
    () => ({})
);

export const redo = createAction<Partial<BuilderState>>(
    BuilderActionEnums.redo,
    () => ({})
);

export const deleteNode = createAction<Partial<BuilderState>, { id: string }>(
    BuilderActionEnums.deleteNode,
    (payload) => ({
        graph: undefined,
        isDirty: true,
        ...payload
    })
) as unknown as (payload: { id: string }) => {
    type: string;
    payload: Partial<BuilderState> & { id: string };
};

export const setNodes = createAction<Partial<BuilderState>, BotNode[]>(
    BuilderActionEnums.setNodes,
    (nodes) => ({
        graph: undefined,
        isDirty: true,
        nodes
    })
) as unknown as (nodes: BotNode[]) => {
    type: string;
    payload: Partial<BuilderState> & { nodes: BotNode[] };
};

export const setEdges = createAction<Partial<BuilderState>, BotEdge[]>(
    BuilderActionEnums.setEdges,
    (edges) => ({
        graph: undefined,
        isDirty: true,
        edges
    })
) as unknown as (edges: BotEdge[]) => {
    type: string;
    payload: Partial<BuilderState> & { edges: BotEdge[] };
};

export const deleteSelectedEdge = createAction<Partial<BuilderState>>(
    BuilderActionEnums.deleteSelectedEdge,
    () => ({
        graph: undefined,
        selectedEdgeId: undefined,
        isDirty: true
    })
);

export const setValidationResults = createAction<Partial<BuilderState>, ValidationResult[]>(
    BuilderActionEnums.setValidationResults,
    (validationResults) => ({
        validationResults
    })
);

export const markSaved = createAction<Partial<BuilderState>, BotGraph>(
    BuilderActionEnums.markSaved,
    (graph) => ({
        graph,
        isDirty: false,
        lastSavedAt: new Date().toISOString()
    })
);

export const setSimulatorOpen = createAction<Partial<BuilderState>, boolean>(
    BuilderActionEnums.setSimulatorOpen,
    (isSimulatorOpen) => ({
        isSimulatorOpen
    })
);

export const resetGraph = createAction<Partial<BuilderState>, BotGraph>(
    BuilderActionEnums.resetGraph,
    (graph) => ({
        graph,
        selectedNodeId: graph.nodes[0]?.id,
        selectedEdgeId: undefined,
        validationResults: [],
        isDirty: false,
        isSimulatorOpen: false,
        lastSavedAt: undefined
    })
);
