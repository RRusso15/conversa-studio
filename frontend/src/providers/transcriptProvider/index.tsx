"use client";

import { useCallback, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { Action } from "redux-actions";
import {
    clearSelectedTranscript as clearSelectedTranscriptAction,
    getTranscriptError,
    getTranscriptPending,
    getTranscriptSuccess,
    getTranscriptsError,
    getTranscriptsPending,
    getTranscriptsSuccess,
    setTranscriptFilters as setTranscriptFiltersAction
} from "./actions";
import {
    INITIAL_STATE,
    TranscriptActionContext,
    TranscriptStateContext,
    type ITranscriptRequestError,
    type ITranscriptStateContext
} from "./context";
import { TranscriptReducer } from "./reducer";
import {
    getTranscript as getTranscriptRequest,
    getTranscripts as getTranscriptsRequest,
    type ITranscriptDetail
} from "@/utils/transcript-api";

interface TranscriptProviderProps {
    children: ReactNode;
}

/**
 * Provides transcript inbox and detail state for developer transcript pages.
 */
export const TranscriptProvider = ({ children }: TranscriptProviderProps) => {
    const [state, rawDispatch] = useReducer(TranscriptReducer, INITIAL_STATE);
    const dispatch = rawDispatch as React.Dispatch<Action<Partial<ITranscriptStateContext>>>;

    const getTranscripts = useCallback(async (): Promise<void> => {
        dispatch(getTranscriptsPending());

        try {
            const payload = await getTranscriptsRequest(state.filters);
            dispatch(getTranscriptsSuccess(payload));
        } catch (error) {
            dispatch(getTranscriptsError(toTranscriptRequestError(error, "We could not load transcripts.")));
        }
    }, [dispatch, state.filters]);

    const getTranscript = useCallback(async (id: string): Promise<ITranscriptDetail | undefined> => {
        dispatch(getTranscriptPending({ selectedTranscriptId: id }));

        try {
            const transcript = await getTranscriptRequest(id);
            dispatch(getTranscriptSuccess(transcript));
            return transcript;
        } catch (error) {
            dispatch(getTranscriptError(toTranscriptRequestError(error, "We could not load this transcript.")));
            return undefined;
        }
    }, [dispatch]);

    const setTranscriptFilters = useCallback((filters: Partial<ITranscriptStateContext["filters"]>): void => {
        dispatch(setTranscriptFiltersAction(filters));
    }, [dispatch]);

    const clearSelectedTranscript = useCallback((): void => {
        dispatch(clearSelectedTranscriptAction());
    }, [dispatch]);

    const actionValue = useMemo(() => ({
        getTranscripts,
        getTranscript,
        setTranscriptFilters,
        clearSelectedTranscript
    }), [clearSelectedTranscript, getTranscript, getTranscripts, setTranscriptFilters]);

    return (
        <TranscriptStateContext.Provider value={state}>
            <TranscriptActionContext.Provider value={actionValue}>
                {children}
            </TranscriptActionContext.Provider>
        </TranscriptStateContext.Provider>
    );
};

/**
 * Reads transcript provider state.
 */
export const useTranscriptState = () => {
    const context = useContext(TranscriptStateContext);

    if (!context) {
        throw new Error("useTranscriptState must be used within a TranscriptProvider");
    }

    return context;
};

/**
 * Reads transcript provider actions.
 */
export const useTranscriptActions = () => {
    const context = useContext(TranscriptActionContext);

    if (!context) {
        throw new Error("useTranscriptActions must be used within a TranscriptProvider");
    }

    return context;
};

function toTranscriptRequestError(error: unknown, fallbackMessage: string): ITranscriptRequestError {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        "status" in error.response
    ) {
        const data = error.response.data as {
            error?: {
                message?: string;
                details?: string;
                validationErrors?: Array<{
                    message?: string;
                }>;
            };
        };
        const status = error.response.status as number | undefined;
        const backendMessage = data.error?.validationErrors
            ?.map((validationError) => validationError.message)
            .filter((message): message is string => Boolean(message))
            .join(" ")
            ?? data.error?.details
            ?? data.error?.message
            ?? fallbackMessage;

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
                message: "You do not have permission to inspect transcripts."
            };
        }

        if (status === 404 || status === 405) {
            return {
                code: "method_not_allowed",
                status,
                message: "The deployed transcript API is out of sync with this frontend. Please redeploy the backend."
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
