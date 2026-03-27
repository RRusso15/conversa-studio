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
    setSaveStatus as setSaveStatusAction,
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
    type IBotMutationResult,
    type IBotRequestError,
    type IBotStateContext,
    type IBotSummary,
    type IBotValidationOutcome
} from "./context";
import { BotReducer } from "./reducer";
import { getAxiosInstance, type IAxiosRedirectControlConfig } from "@/utils/axiosInstance";
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
        validationErrors?: Array<{
            message?: string;
            members?: string[];
        }>;
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
const BOT_REQUEST_CONFIG = {
    skipUnauthorizedRedirect: true,
    skipForbiddenRedirect: true
} as IAxiosRedirectControlConfig;

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
            const response = await instance.get<IAbpAjaxResponse<IListResultDto<IApiBotSummary>>>(GET_BOTS_URL, BOT_REQUEST_CONFIG);
            const payload = unwrapResponse(response.data, "We could not load your bots.");
            dispatch(getBotsSuccess(payload.items.map(mapSummaryFromApi)));
        } catch (error) {
            dispatch(getBotsError(toRequestError(error, "We could not load your bots.")));
        }
    }, []);

    const getBot = useCallback(async (id: string): Promise<IBotDefinition | undefined> => {
        dispatch(getBotPending());

        try {
            const instance = getAxiosInstance();
            const response = await instance.get<IAbpAjaxResponse<IApiBotDefinition>>(
                `${GET_BOT_URL}?Id=${encodeURIComponent(id)}`,
                BOT_REQUEST_CONFIG
            );
            const payload = mapDefinitionFromApi(
                unwrapResponse(response.data, "We could not load this bot.")
            );
            dispatch(getBotSuccess(payload));
            return payload;
        } catch (error) {
            dispatch(getBotError(toRequestError(error, "We could not load this bot.")));
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

    const createBotDraft = useCallback(async (graph: BotGraph): Promise<IBotMutationResult> => {
        dispatch(createBotDraftPending());

        try {
            const instance = getAxiosInstance();
            const response = await instance.post<IAbpAjaxResponse<IApiBotDefinition>>(
                CREATE_DRAFT_URL,
                {
                    name: graph.metadata.name,
                    graph
                },
                BOT_REQUEST_CONFIG
            );
            const payload = mapDefinitionFromApi(
                unwrapResponse(response.data, "We could not create this bot.")
            );
            dispatch(createBotDraftSuccess(payload));
            return { bot: payload };
        } catch (error) {
            const requestError = toRequestError(error, "We could not create this bot.");
            dispatch(createBotDraftError(requestError));
            return { error: requestError };
        }
    }, []);

    const updateBotDraft = useCallback(async (id: string, graph: BotGraph): Promise<IBotMutationResult> => {
        dispatch(updateBotDraftPending());

        try {
            const instance = getAxiosInstance();
            const response = await instance.put<IAbpAjaxResponse<IApiBotDefinition>>(
                UPDATE_DRAFT_URL,
                {
                    id,
                    name: graph.metadata.name,
                    graph
                },
                BOT_REQUEST_CONFIG
            );
            const payload = mapDefinitionFromApi(
                unwrapResponse(response.data, "We could not save this bot.")
            );
            dispatch(updateBotDraftSuccess(payload));
            return { bot: payload };
        } catch (error) {
            const requestError = toRequestError(error, "We could not save this bot.");
            dispatch(updateBotDraftError(requestError));
            return { error: requestError };
        }
    }, []);

    const validateBotDraft = useCallback(async (graph: BotGraph): Promise<IBotValidationOutcome> => {
        dispatch(validateBotDraftPending());

        try {
            const instance = getAxiosInstance();
            const response = await instance.post<IAbpAjaxResponse<IListResultDto<ValidationResult>>>(
                VALIDATE_DRAFT_URL,
                { graph },
                BOT_REQUEST_CONFIG
            );
            const payload = unwrapResponse(response.data, "We could not validate this bot.");
            dispatch(validateBotDraftSuccess(payload.items));
            return { results: payload.items };
        } catch (error) {
            const requestError = toRequestError(error, "We could not validate this bot.");
            dispatch(validateBotDraftError(requestError));
            return { error: requestError };
        }
    }, []);

    const clearActiveBot = useCallback((): void => {
        dispatch(clearActiveBotAction());
    }, []);

    const setSaveStatus = useCallback((status: IBotStateContext["saveStatus"], errorMessage?: string): void => {
        dispatch(setSaveStatusAction({ status, errorMessage }));
    }, []);

    const actionValue = useMemo(() => ({
        getBots,
        getBot,
        initializeNewBotDraft,
        createBotDraft,
        updateBotDraft,
        validateBotDraft,
        setSaveStatus,
        clearActiveBot
    }), [
        clearActiveBot,
        createBotDraft,
        getBot,
        getBots,
        initializeNewBotDraft,
        setSaveStatus,
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

function toRequestError(error: unknown, fallbackMessage: string): IBotRequestError {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        "status" in error.response
    ) {
        const data = error.response.data as IAbpAjaxResponse<unknown>;
        const status = error.response.status as number | undefined;
        const backendMessage = buildBackendErrorMessage(data, fallbackMessage);

        if (status === 401) {
            return {
                code: "unauthorized",
                status,
                message: "Your session has expired. Please sign in again."
            };
        }

        if (status === 403) {
            return {
                code: "forbidden",
                status,
                message: "You do not have permission to save or validate this bot."
            };
        }

        if (status === 405) {
            return {
                code: "method_not_allowed",
                status,
                message: "The deployed builder API is out of sync with this frontend. Please redeploy the backend."
            };
        }

        if (status !== undefined && status >= 500) {
            return {
                code: "server_error",
                status,
                message: backendMessage
            };
        }

        return {
            code: "unknown",
            status,
            message: backendMessage
        };
    }

    if (error instanceof Error && error.message) {
        return {
            code: "network_error",
            message: error.message
        };
    }

    return {
        code: "unknown",
        message: fallbackMessage
    };
}

function buildBackendErrorMessage(data: IAbpAjaxResponse<unknown>, fallbackMessage: string): string {
    const validationMessage = data.error?.validationErrors
        ?.map((validationError) => validationError.message)
        .filter((message): message is string => Boolean(message))
        .join(" ");

    return validationMessage
        ?? data.error?.details
        ?? data.error?.message
        ?? fallbackMessage;
}
