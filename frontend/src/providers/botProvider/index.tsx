"use client";

import { useCallback, useContext, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import type { Action } from "redux-actions";
import {
    clearActiveBot as clearActiveBotAction,
    createBotDraftError,
    createBotDraftPending,
    createBotDraftSuccess,
    getBotError,
    getBotPending,
    getBotSuccess,
    getBotsError,
    getBotsPending,
    getBotsSuccess,
    initializeNewBotDraft as initializeNewBotDraftAction,
    updateBotDraftError,
    updateBotDraftPending,
    updateBotDraftSuccess,
    validateBotDraftError,
    validateBotDraftPending,
    validateBotDraftSuccess
} from "./actions";
import {
    BotActionContext,
    BotStateContext,
    INITIAL_STATE,
    type IBotDefinition,
    type IBotStateContext,
    type IBotSummary
} from "./context";
import { BotReducer } from "./reducer";
import { getAxiosInstance } from "@/utils/axiosInstance";
import type { BotGraph, ValidationResult } from "@/components/developer/builder/types";
import { createStarterGraph } from "@/components/developer/builder/mock-data";

interface BotProviderProps {
    children: ReactNode;
}

interface IAbpAjaxResponse<T> {
    result?: T;
    success: boolean;
    targetUrl?: string;
    error?: {
        message?: string;
        details?: string;
    };
}

interface IListResultDto<T> {
    items: T[];
}

interface IApiBotSummary {
    id: string;
    name: string;
    status: string;
    updatedAt: string;
}

interface IApiBotDefinition extends IApiBotSummary {
    draftVersion: number;
    publishedVersion?: number;
    graph: BotGraph;
}

const GET_BOTS_URL = "/api/services/app/BotDefinition/GetBots";
const GET_BOT_URL = "/api/services/app/BotDefinition/GetBot";
const CREATE_DRAFT_URL = "/api/services/app/BotDefinition/CreateDraft";
const UPDATE_DRAFT_URL = "/api/services/app/BotDefinition/UpdateDraft";
const VALIDATE_DRAFT_URL = "/api/services/app/BotDefinition/ValidateDraft";

/**
 * Provides bot list, active draft, and persistence workflows for builder pages.
 */
export const BotProvider = ({ children }: BotProviderProps) => {
    const [state, rawDispatch] = useReducer(BotReducer, INITIAL_STATE);
    const dispatch = rawDispatch as React.Dispatch<Action<Partial<IBotStateContext>>>;

    const getBots = useCallback(async (): Promise<void> => {
        dispatch(getBotsPending());

        try {
            const instance = getAxiosInstance();
            const response = await instance.get<IAbpAjaxResponse<IListResultDto<IApiBotSummary>>>(GET_BOTS_URL);
            const payload = unwrapResponse(response.data, "We could not load your bots.");
            dispatch(getBotsSuccess(payload.items.map(mapSummaryFromApi)));
        } catch (error) {
            dispatch(getBotsError(toErrorMessage(error, "We could not load your bots.")));
        }
    }, []);

    const getBot = useCallback(async (id: string): Promise<IBotDefinition | undefined> => {
        dispatch(getBotPending());

        try {
            const instance = getAxiosInstance();
            const response = await instance.get<IAbpAjaxResponse<IApiBotDefinition>>(`${GET_BOT_URL}?Id=${encodeURIComponent(id)}`);
            const payload = mapDefinitionFromApi(
                unwrapResponse(response.data, "We could not load this bot.")
            );
            dispatch(getBotSuccess(payload));
            return payload;
        } catch (error) {
            dispatch(getBotError(toErrorMessage(error, "We could not load this bot.")));
            return undefined;
        }
    }, []);

    const initializeNewBotDraft = useCallback(async (): Promise<IBotDefinition> => {
        const graph = createStarterGraph("new-bot", "Untitled Bot");
        const activeBot: IBotDefinition = {
            id: graph.metadata.id,
            name: graph.metadata.name,
            status: "draft",
            updatedAt: new Date().toISOString(),
            draftVersion: 1,
            graph
        };

        dispatch(initializeNewBotDraftAction(activeBot));
        return activeBot;
    }, []);

    const createBotDraft = useCallback(async (graph: BotGraph): Promise<IBotDefinition | undefined> => {
        dispatch(createBotDraftPending());

        try {
            const instance = getAxiosInstance();
            const response = await instance.post<IAbpAjaxResponse<IApiBotDefinition>>(
                CREATE_DRAFT_URL,
                {
                    name: graph.metadata.name,
                    graph
                }
            );
            const payload = mapDefinitionFromApi(
                unwrapResponse(response.data, "We could not create this bot.")
            );
            dispatch(createBotDraftSuccess(payload));
            return payload;
        } catch (error) {
            dispatch(createBotDraftError(toErrorMessage(error, "We could not create this bot.")));
            return undefined;
        }
    }, []);

    const updateBotDraft = useCallback(async (id: string, graph: BotGraph): Promise<IBotDefinition | undefined> => {
        dispatch(updateBotDraftPending());

        try {
            const instance = getAxiosInstance();
            const response = await instance.post<IAbpAjaxResponse<IApiBotDefinition>>(
                UPDATE_DRAFT_URL,
                {
                    id,
                    name: graph.metadata.name,
                    graph
                }
            );
            const payload = mapDefinitionFromApi(
                unwrapResponse(response.data, "We could not save this bot.")
            );
            dispatch(updateBotDraftSuccess(payload));
            return payload;
        } catch (error) {
            dispatch(updateBotDraftError(toErrorMessage(error, "We could not save this bot.")));
            return undefined;
        }
    }, []);

    const validateBotDraft = useCallback(async (graph: BotGraph): Promise<ValidationResult[]> => {
        dispatch(validateBotDraftPending());

        try {
            const instance = getAxiosInstance();
            const response = await instance.post<IAbpAjaxResponse<IListResultDto<ValidationResult>>>(
                VALIDATE_DRAFT_URL,
                { graph }
            );
            const payload = unwrapResponse(response.data, "We could not validate this bot.");
            dispatch(validateBotDraftSuccess(payload.items));
            return payload.items;
        } catch (error) {
            dispatch(validateBotDraftError(toErrorMessage(error, "We could not validate this bot.")));
            return [];
        }
    }, []);

    const clearActiveBot = useCallback((): void => {
        dispatch(clearActiveBotAction());
    }, []);

    const actionValue = useMemo(() => ({
        getBots,
        getBot,
        initializeNewBotDraft,
        createBotDraft,
        updateBotDraft,
        validateBotDraft,
        clearActiveBot
    }), [
        clearActiveBot,
        createBotDraft,
        getBot,
        getBots,
        initializeNewBotDraft,
        updateBotDraft,
        validateBotDraft
    ]);

    return (
        <BotStateContext.Provider value={state}>
            <BotActionContext.Provider value={actionValue}>
                {children}
            </BotActionContext.Provider>
        </BotStateContext.Provider>
    );
};

/**
 * Reads bot persistence state.
 */
export const useBotState = () => {
    const context = useContext(BotStateContext);

    if (!context) {
        throw new Error("useBotState must be used within a BotProvider");
    }

    return context;
};

/**
 * Reads bot persistence actions.
 */
export const useBotActions = () => {
    const context = useContext(BotActionContext);

    if (!context) {
        throw new Error("useBotActions must be used within a BotProvider");
    }

    return context;
};

function mapSummaryFromApi(bot: IApiBotSummary): IBotSummary {
    return {
        id: bot.id,
        name: bot.name,
        status: normalizeStatus(bot.status),
        updatedAt: bot.updatedAt
    };
}

function mapDefinitionFromApi(bot: IApiBotDefinition): IBotDefinition {
    return {
        id: bot.id,
        name: bot.name,
        status: normalizeStatus(bot.status),
        updatedAt: bot.updatedAt,
        draftVersion: bot.draftVersion,
        publishedVersion: bot.publishedVersion,
        graph: {
            ...bot.graph,
            metadata: {
                ...bot.graph.metadata,
                id: bot.id,
                name: bot.name,
                status: normalizeStatus(bot.status),
                version: `v${bot.draftVersion}`
            }
        }
    };
}

function normalizeStatus(status: string): "draft" | "published" {
    return status.toLowerCase() === "published" ? "published" : "draft";
}

function unwrapResponse<T>(payload: IAbpAjaxResponse<T> | T, fallbackMessage: string): T {
    if (isAbpAjaxResponse<T>(payload)) {
        if (payload.result !== undefined) {
            return payload.result;
        }

        throw new Error(payload.error?.message ?? fallbackMessage);
    }

    return payload;
}

function isAbpAjaxResponse<T>(payload: IAbpAjaxResponse<T> | T): payload is IAbpAjaxResponse<T> {
    return typeof payload === "object" && payload !== null && "__abp" in payload;
}

function toErrorMessage(error: unknown, fallbackMessage: string): string {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response
    ) {
        const data = error.response.data as IAbpAjaxResponse<unknown>;
        return data?.error?.message ?? fallbackMessage;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallbackMessage;
}
