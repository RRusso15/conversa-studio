"use client";

import { useCallback, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { Action } from "redux-actions";
import {
    getAnalyticsBreakdown as getAnalyticsBreakdownRequest,
    getAnalyticsOverview as getAnalyticsOverviewRequest,
    getAnalyticsTimeseries as getAnalyticsTimeseriesRequest
} from "@/utils/analytics-api";
import {
    getAnalyticsError,
    getAnalyticsPending,
    getAnalyticsSuccess,
    setAnalyticsFilters as setAnalyticsFiltersAction
} from "./actions";
import {
    ANALYTICS_DATE_RANGE_OPTIONS,
    AnalyticsActionContext,
    AnalyticsStateContext,
    INITIAL_STATE,
    type IAnalyticsRequestError,
    type IAnalyticsStateContext
} from "./context";
import { AnalyticsReducer } from "./reducer";

interface AnalyticsProviderProps {
    children: ReactNode;
}

/**
 * Provides analytics dashboard state for the developer workspace.
 */
export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
    const [state, rawDispatch] = useReducer(AnalyticsReducer, INITIAL_STATE);
    const dispatch = rawDispatch as React.Dispatch<Action<Partial<IAnalyticsStateContext>>>;

    const getAnalytics = useCallback(async (): Promise<void> => {
        dispatch(getAnalyticsPending());

        try {
            const [overview, timeseries, breakdown] = await Promise.all([
                getAnalyticsOverviewRequest(state.filters),
                getAnalyticsTimeseriesRequest(state.filters),
                getAnalyticsBreakdownRequest(state.filters)
            ]);

            dispatch(getAnalyticsSuccess({
                overview,
                timeseries,
                breakdown
            }));
        } catch (error) {
            dispatch(getAnalyticsError(toAnalyticsRequestError(error, "We could not load analytics.")));
        }
    }, [dispatch, state.filters]);

    const setAnalyticsFilters = useCallback((filters: Partial<IAnalyticsStateContext["filters"]>): void => {
        dispatch(setAnalyticsFiltersAction(filters));
    }, [dispatch]);

    const actionValue = useMemo(() => ({
        getAnalytics,
        setAnalyticsFilters
    }), [getAnalytics, setAnalyticsFilters]);

    return (
        <AnalyticsStateContext.Provider value={state}>
            <AnalyticsActionContext.Provider value={actionValue}>
                {children}
            </AnalyticsActionContext.Provider>
        </AnalyticsStateContext.Provider>
    );
};

/**
 * Reads analytics provider state.
 */
export const useAnalyticsState = () => {
    const context = useContext(AnalyticsStateContext);

    if (!context) {
        throw new Error("useAnalyticsState must be used within an AnalyticsProvider");
    }

    return context;
};

/**
 * Reads analytics provider actions.
 */
export const useAnalyticsActions = () => {
    const context = useContext(AnalyticsActionContext);

    if (!context) {
        throw new Error("useAnalyticsActions must be used within an AnalyticsProvider");
    }

    return context;
};

export { ANALYTICS_DATE_RANGE_OPTIONS };

function toAnalyticsRequestError(error: unknown, fallbackMessage: string): IAnalyticsRequestError {
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
                message: "You do not have permission to inspect analytics."
            };
        }

        if (status === 404 || status === 405) {
            return {
                code: "method_not_allowed",
                status,
                message: "The deployed analytics API is out of sync with this frontend. Please redeploy the backend."
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
