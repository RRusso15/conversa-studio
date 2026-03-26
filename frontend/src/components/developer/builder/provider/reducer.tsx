"use client";

import { handleActions } from "redux-actions";
import { BuilderActionEnums } from "./actions";
import type { BuilderState } from "../types";

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
            ...state,
            ...action.payload,
            graph: {
                ...state.graph,
                nodes: action.payload?.newNode
                    ? [...state.graph.nodes, action.payload.newNode]
                    : state.graph.nodes
            }
        }),
        [BuilderActionEnums.updateNode]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload,
            graph: {
                ...state.graph,
                nodes: state.graph.nodes.map((node) =>
                    node.id === action.payload?.id ? { ...node, ...action.payload?.node } : node
                )
            }
        }),
        [BuilderActionEnums.updateMetadata]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload,
            graph: {
                ...state.graph,
                metadata: {
                    ...state.graph.metadata,
                    ...action.payload?.metadata
                }
            }
        }),
        [BuilderActionEnums.deleteNode]: (state, action: IReducerAction) => {
            const nextNodes = state.graph.nodes.filter((node) => node.id !== action.payload?.id);
            const nextEdges = state.graph.edges.filter(
                (edge) => edge.source !== action.payload?.id && edge.target !== action.payload?.id
            );

            return {
                ...state,
                ...action.payload,
                graph: {
                    ...state.graph,
                    nodes: nextNodes,
                    edges: nextEdges
                },
                selectedNodeId: nextNodes[0]?.id,
                selectedEdgeId: undefined
            };
        },
        [BuilderActionEnums.setNodes]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload,
            graph: {
                ...state.graph,
                nodes: action.payload?.nodes ?? state.graph.nodes
            }
        }),
        [BuilderActionEnums.setEdges]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload,
            graph: {
                ...state.graph,
                edges: action.payload?.edges ?? state.graph.edges
            }
        }),
        [BuilderActionEnums.deleteSelectedEdge]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload,
            graph: {
                ...state.graph,
                edges: state.graph.edges.filter((edge) => edge.id !== state.selectedEdgeId)
            }
        }),
        [BuilderActionEnums.setValidationResults]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BuilderActionEnums.markSaved]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload,
            graph: action.payload?.graph ?? state.graph
        }),
        [BuilderActionEnums.setSimulatorOpen]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BuilderActionEnums.resetGraph]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload,
            graph: action.payload?.graph ?? state.graph
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
        validationResults: [],
        isDirty: false,
        isSimulatorOpen: false
    }
);
