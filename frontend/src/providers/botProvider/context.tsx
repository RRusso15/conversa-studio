"use client";

import { createContext } from "react";
import type { BotGraph, ValidationResult } from "@/components/developer/builder/types";
import type { IAiKnowledgeStatus } from "@/utils/ai-knowledge-api";

export interface IBotSummary {
    id: string;
    name: string;
    status: "draft" | "published";
    draftVersion: number;
    publishedVersion?: number;
    hasUnpublishedChanges: boolean;
    updatedAt: string;
}

export interface IBotDefinition extends IBotSummary {
    graph: BotGraph;
    aiKnowledge?: IAiKnowledgeStatus;
}

export type BotRequestErrorCode =
    | "unauthorized"
    | "forbidden"
    | "method_not_allowed"
    | "server_error"
    | "network_error"
    | "unknown";

export interface IBotRequestError {
    code: BotRequestErrorCode;
    message: string;
    status?: number;
}

export interface IBotMutationResult {
    bot?: IBotDefinition;
    error?: IBotRequestError;
}

export interface IBotValidationOutcome {
    results?: ValidationResult[];
    error?: IBotRequestError;
}

export interface IBotStateContext {
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    bots?: IBotSummary[];
    activeBot?: IBotDefinition;
    draftIdentity: "temporary" | "persisted";
    saveStatus: "idle" | "saving" | "saved" | "error" | "validation_blocked" | "permission_denied" | "api_mismatch";
    deleteStatus: "idle" | "deleting" | "error";
    deleteErrorMessage?: string;
    aiKnowledgeStatus: "idle" | "loading" | "saving" | "error";
    aiKnowledgeErrorMessage?: string;
    validationResults?: ValidationResult[];
    errorCode?: BotRequestErrorCode;
    errorMessage?: string;
}

export interface IBotActionContext {
    getBots: () => Promise<void>;
    getBot: (id: string) => Promise<IBotDefinition | undefined>;
    getBotAiKnowledge: (botId: string) => Promise<IAiKnowledgeStatus | undefined>;
    initializeNewBotDraft: () => Promise<IBotDefinition>;
    createBotDraft: (graph: BotGraph) => Promise<IBotMutationResult>;
    updateBotDraft: (id: string, graph: BotGraph) => Promise<IBotMutationResult>;
    deleteBot: (id: string) => Promise<{ error?: IBotRequestError }>;
    publishBotDraft: (id: string) => Promise<IBotMutationResult>;
    validateBotDraft: (graph: BotGraph) => Promise<IBotValidationOutcome>;
    upsertBotAiSettings: (input: {
        botId: string;
        apiKey: string;
        generationModel: string;
        embeddingModel: string;
    }) => Promise<IAiKnowledgeStatus | undefined>;
    addBotAiTextSource: (input: {
        botId: string;
        title: string;
        text: string;
    }) => Promise<IAiKnowledgeStatus | undefined>;
    addBotAiUrlSource: (input: {
        botId: string;
        title: string;
        url: string;
    }) => Promise<IAiKnowledgeStatus | undefined>;
    addBotAiPdfSource: (input: {
        botId: string;
        title: string;
        fileName: string;
        base64Content: string;
    }) => Promise<IAiKnowledgeStatus | undefined>;
    reingestBotAiSource: (botId: string, sourceId: string) => Promise<IAiKnowledgeStatus | undefined>;
    deleteBotAiSource: (botId: string, sourceId: string) => Promise<IAiKnowledgeStatus | undefined>;
    clearBotAiKnowledgeError: () => void;
    setSaveStatus: (status: IBotStateContext["saveStatus"], errorMessage?: string) => void;
    clearActiveBot: () => void;
}

export const INITIAL_STATE: IBotStateContext = {
    isPending: false,
    isSuccess: false,
    isError: false,
    draftIdentity: "temporary",
    saveStatus: "idle",
    deleteStatus: "idle",
    aiKnowledgeStatus: "idle"
};

export const INITIAL_ACTION_STATE: IBotActionContext = {
    getBots: async () => undefined,
    getBot: async () => undefined,
    getBotAiKnowledge: async () => undefined,
    initializeNewBotDraft: async () => ({
        id: "new-bot",
        name: "Untitled Bot",
        status: "draft",
        updatedAt: new Date().toISOString(),
        draftVersion: 1,
        hasUnpublishedChanges: true,
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
        aiKnowledge: undefined
    }),
    createBotDraft: async () => ({}),
    updateBotDraft: async () => ({}),
    deleteBot: async () => ({}),
    publishBotDraft: async () => ({}),
    validateBotDraft: async () => ({}),
    upsertBotAiSettings: async () => undefined,
    addBotAiTextSource: async () => undefined,
    addBotAiUrlSource: async () => undefined,
    addBotAiPdfSource: async () => undefined,
    reingestBotAiSource: async () => undefined,
    deleteBotAiSource: async () => undefined,
    clearBotAiKnowledgeError: () => undefined,
    setSaveStatus: () => undefined,
    clearActiveBot: () => undefined
};

export const BotStateContext =
    createContext<IBotStateContext>(INITIAL_STATE);

export const BotActionContext =
    createContext<IBotActionContext | undefined>(undefined);
