"use client";

import { handleActions } from "redux-actions";
import { BuilderActionEnums } from "./actions";
import type { BotGraph, BuilderState } from "../types";

const HISTORY_LIMIT = 50;

interface IReducerAction {
    payload?: Partial<BuilderState> & {
        id?: string;
        node?: Partial<BuilderState["graph"]["nodes"][number]>;
        newNode?: BuilderState["graph"]["nodes"][number];
        nodes?: BuilderState["graph"]["nodes"];
        edges?: BuilderState["graph"]["edges"];
        metadata?: Partial<BuilderState["graph"]["metadata"]>;
    };
}

export const BuilderReducer = handleActions<BuilderState, Partial<BuilderState>>(
    {
        [BuilderActionEnums.selectNode]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BuilderActionEnums.selectEdge]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BuilderActionEnums.addNode]: (state, action: IReducerAction) => ({
            ...commitGraphChange(
                state,
                {
                    ...state.graph,
                    nodes: action.payload?.newNode
                        ? [...state.graph.nodes, action.payload.newNode]
                        : state.graph.nodes
                },
                action.payload
            ),
            ...omitGraphState(action.payload)
        }),
        [BuilderActionEnums.updateNode]: (state, action: IReducerAction) => ({
            ...commitGraphChange(
                state,
                {
                    ...state.graph,
                    nodes: state.graph.nodes.map((node) =>
                        node.id === action.payload?.id ? { ...node, ...action.payload?.node } : node
                    )
                },
                action.payload
            ),
            ...omitGraphState(action.payload)
        }),
        [BuilderActionEnums.updateMetadata]: (state, action: IReducerAction) => ({
            ...commitGraphChange(
                state,
                {
                    ...state.graph,
                    metadata: {
                        ...state.graph.metadata,
                        ...action.payload?.metadata
                    }
                },
                action.payload
            ),
            ...omitGraphState(action.payload)
        }),
        [BuilderActionEnums.undo]: (state) => {
            if (state.past.length === 0) {
                return state;
            }

            const previousGraph = cloneGraph(state.past[state.past.length - 1]);
            const nextSelection = getValidSelection(previousGraph, state.selectedNodeId, state.selectedEdgeId);

            return {
                ...state,
                graph: previousGraph,
                past: state.past.slice(0, -1),
                future: [cloneGraph(state.graph), ...state.future],
                selectedNodeId: nextSelection.selectedNodeId,
                selectedEdgeId: nextSelection.selectedEdgeId,
                validationResults: [],
                isDirty: true
            };
        },
        [BuilderActionEnums.redo]: (state) => {
            if (state.future.length === 0) {
                return state;
            }

            const nextGraph = cloneGraph(state.future[0]);
            const nextSelection = getValidSelection(nextGraph, state.selectedNodeId, state.selectedEdgeId);

            return {
                ...state,
                graph: nextGraph,
                past: [...trimPastHistory([...state.past, cloneGraph(state.graph)])],
                future: state.future.slice(1),
                selectedNodeId: nextSelection.selectedNodeId,
                selectedEdgeId: nextSelection.selectedEdgeId,
                validationResults: [],
                isDirty: true
            };
        },
        [BuilderActionEnums.deleteNode]: (state, action: IReducerAction) => {
            const nextNodes = state.graph.nodes.filter((node) => node.id !== action.payload?.id);
            const nextEdges = state.graph.edges.filter(
                (edge) => edge.source !== action.payload?.id && edge.target !== action.payload?.id
            );

            return {
                ...commitGraphChange(
                    state,
                    {
                        ...state.graph,
                        nodes: nextNodes,
                        edges: nextEdges
                    },
                    action.payload
                ),
                selectedNodeId: nextNodes[0]?.id,
                selectedEdgeId: undefined
            };
        },
        [BuilderActionEnums.setNodes]: (state, action: IReducerAction) => ({
            ...commitGraphChange(
                state,
                {
                    ...state.graph,
                    nodes: action.payload?.nodes ?? state.graph.nodes
                },
                action.payload
            ),
            ...omitGraphState(action.payload)
        }),
        [BuilderActionEnums.setEdges]: (state, action: IReducerAction) => ({
            ...commitGraphChange(
                state,
                {
                    ...state.graph,
                    edges: action.payload?.edges ?? state.graph.edges
                },
                action.payload
            ),
            ...omitGraphState(action.payload)
        }),
        [BuilderActionEnums.deleteSelectedEdge]: (state, action: IReducerAction) => ({
            ...commitGraphChange(
                state,
                {
                    ...state.graph,
                    edges: state.graph.edges.filter((edge) => edge.id !== state.selectedEdgeId)
                },
                action.payload
            ),
            ...omitGraphState(action.payload)
        }),
        [BuilderActionEnums.setValidationResults]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BuilderActionEnums.markSaved]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload,
            graph: action.payload?.graph ?? state.graph,
            selectedNodeId: getValidSelection(action.payload?.graph ?? state.graph, state.selectedNodeId, state.selectedEdgeId).selectedNodeId,
            selectedEdgeId: getValidSelection(action.payload?.graph ?? state.graph, state.selectedNodeId, state.selectedEdgeId).selectedEdgeId
        }),
        [BuilderActionEnums.setSimulatorOpen]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BuilderActionEnums.resetGraph]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload,
            graph: action.payload?.graph ?? state.graph,
            past: [],
            future: []
        })
    },
    {
        graph: {
            metadata: {
                id: "new-bot",
                name: "Untitled Bot",
                status: "draft",
                version: "v1"
            },
            nodes: [],
            edges: []
        },
        past: [],
        future: [],
        validationResults: [],
        isDirty: false,
        isSimulatorOpen: false
    }
);

function commitGraphChange(
    state: BuilderState,
    nextGraph: BotGraph,
    payload?: IReducerAction["payload"]
): BuilderState {
    if (serializeGraph(state.graph) === serializeGraph(nextGraph)) {
        return {
            ...state,
            ...omitGraphState(payload)
        };
    }

    const nextSelection = getValidSelection(nextGraph, state.selectedNodeId, state.selectedEdgeId);

    return {
        ...state,
        ...omitGraphState(payload),
        graph: nextGraph,
        past: trimPastHistory([...state.past, cloneGraph(state.graph)]),
        future: [],
        selectedNodeId: nextSelection.selectedNodeId,
        selectedEdgeId: nextSelection.selectedEdgeId,
        validationResults: [],
        isDirty: true
    };
}

function trimPastHistory(past: BotGraph[]): BotGraph[] {
    return past.length > HISTORY_LIMIT ? past.slice(past.length - HISTORY_LIMIT) : past;
}

function getValidSelection(
    graph: BotGraph,
    selectedNodeId?: string,
    selectedEdgeId?: string
): Pick<BuilderState, "selectedNodeId" | "selectedEdgeId"> {
    const nextSelectedNodeId = selectedNodeId && graph.nodes.some((node) => node.id === selectedNodeId)
        ? selectedNodeId
        : undefined;
    const nextSelectedEdgeId = selectedEdgeId && graph.edges.some((edge) => edge.id === selectedEdgeId)
        ? selectedEdgeId
        : undefined;

    return {
        selectedNodeId: nextSelectedNodeId,
        selectedEdgeId: nextSelectedNodeId ? undefined : nextSelectedEdgeId
    };
}

function serializeGraph(graph: BotGraph): string {
    return JSON.stringify(graph);
}

function cloneGraph(graph: BotGraph): BotGraph {
    return JSON.parse(JSON.stringify(graph)) as BotGraph;
}

function omitGraphState(
    payload?: IReducerAction["payload"]
): Partial<BuilderState> {
    if (!payload) {
        return {};
    }

    const rest = { ...payload };

    delete rest.graph;
    delete rest.nodes;
    delete rest.edges;
    delete rest.newNode;
    delete rest.node;
    delete rest.metadata;

    return rest;
}
