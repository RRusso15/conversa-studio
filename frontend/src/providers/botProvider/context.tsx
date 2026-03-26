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

export interface IBotStateContext {
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    bots?: IBotSummary[];
    activeBot?: IBotDefinition;
    draftIdentity: "temporary" | "persisted";
    saveStatus: "idle" | "saving" | "saved" | "error";
    validationResults?: ValidationResult[];
    errorMessage?: string;
}

export interface IBotActionContext {
    getBots: () => Promise<void>;
    getBot: (id: string) => Promise<IBotDefinition | undefined>;
    initializeNewBotDraft: () => Promise<IBotDefinition>;
    createBotDraft: (graph: BotGraph) => Promise<IBotDefinition | undefined>;
    updateBotDraft: (id: string, graph: BotGraph) => Promise<IBotDefinition | undefined>;
    validateBotDraft: (graph: BotGraph) => Promise<ValidationResult[]>;
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
    createBotDraft: async () => undefined,
    updateBotDraft: async () => undefined,
    validateBotDraft: async () => [],
    clearActiveBot: () => undefined
};

export const BotStateContext =
    createContext<IBotStateContext>(INITIAL_STATE);

export const BotActionContext =
    createContext<IBotActionContext | undefined>(undefined);
