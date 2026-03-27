"use client";

import { createContext } from "react";
import type { BotGraph, ValidationResult } from "@/components/developer/builder/types";

export interface IBotSummary {
    id: string;
    name: string;
    status: "draft" | "published";
    updatedAt: string;
}

export interface IBotDefinition extends IBotSummary {
    draftVersion: number;
    publishedVersion?: number;
    graph: BotGraph;
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
    validationResults?: ValidationResult[];
    errorCode?: BotRequestErrorCode;
    errorMessage?: string;
}

export interface IBotActionContext {
    getBots: () => Promise<void>;
    getBot: (id: string) => Promise<IBotDefinition | undefined>;
    initializeNewBotDraft: () => Promise<IBotDefinition>;
    createBotDraft: (graph: BotGraph) => Promise<IBotMutationResult>;
    updateBotDraft: (id: string, graph: BotGraph) => Promise<IBotMutationResult>;
    validateBotDraft: (graph: BotGraph) => Promise<IBotValidationOutcome>;
    setSaveStatus: (status: IBotStateContext["saveStatus"], errorMessage?: string) => void;
    clearActiveBot: () => void;
}

export const INITIAL_STATE: IBotStateContext = {
    isPending: false,
    isSuccess: false,
    isError: false,
    draftIdentity: "temporary",
    saveStatus: "idle"
};

export const INITIAL_ACTION_STATE: IBotActionContext = {
    getBots: async () => undefined,
    getBot: async () => undefined,
    initializeNewBotDraft: async () => ({
        id: "new-bot",
        name: "Untitled Bot",
        status: "draft",
        updatedAt: new Date().toISOString(),
        draftVersion: 1,
        graph: {
            metadata: {
                id: "new-bot",
                name: "Untitled Bot",
                status: "draft",
                version: "v1"
            },
            nodes: [],
            edges: []
        }
    }),
    createBotDraft: async () => ({}),
    updateBotDraft: async () => ({}),
    validateBotDraft: async () => ({}),
    setSaveStatus: () => undefined,
    clearActiveBot: () => undefined
};

export const BotStateContext =
    createContext<IBotStateContext>(INITIAL_STATE);

export const BotActionContext =
    createContext<IBotActionContext | undefined>(undefined);
