"use client";

import { createContext } from "react";
import type {
    AnalyticsDateRange,
    IAnalyticsBreakdown,
    IAnalyticsFilters,
    IAnalyticsOverview,
    IAnalyticsTimeseries
} from "@/utils/analytics-api";

export type AnalyticsRequestErrorCode =
    | "unauthorized"
    | "forbidden"
    | "method_not_allowed"
    | "server_error"
    | "network_error"
    | "unknown";

export interface IAnalyticsRequestError {
    code: AnalyticsRequestErrorCode;
    message: string;
    status?: number;
}

export interface IAnalyticsStateContext {
    filters: Required<Pick<IAnalyticsFilters, "dateRange">> & Pick<IAnalyticsFilters, "botId">;
    overview?: IAnalyticsOverview;
    timeseries?: IAnalyticsTimeseries;
    breakdown?: IAnalyticsBreakdown;
    status: "idle" | "loading" | "error";
    errorMessage?: string;
}

export interface IAnalyticsActionContext {
    getAnalytics: () => Promise<void>;
    setAnalyticsFilters: (filters: Partial<IAnalyticsStateContext["filters"]>) => void;
}

export const INITIAL_STATE: IAnalyticsStateContext = {
    filters: {
        botId: undefined,
        dateRange: "30d"
    },
    status: "idle"
};

export const INITIAL_ACTION_STATE: IAnalyticsActionContext = {
    getAnalytics: async () => undefined,
    setAnalyticsFilters: () => undefined
};

export const AnalyticsStateContext =
    createContext<IAnalyticsStateContext>(INITIAL_STATE);

export const AnalyticsActionContext =
    createContext<IAnalyticsActionContext | undefined>(undefined);

export const ANALYTICS_DATE_RANGE_OPTIONS: Array<{ value: AnalyticsDateRange; label: string }> = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "all", label: "All time" }
];
