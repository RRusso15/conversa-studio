"use strict";

import { getAxiosInstance, type IAxiosRedirectControlConfig } from "./axiosInstance";

export type AnalyticsDateRange = "7d" | "30d" | "90d" | "all";

export interface IAnalyticsFilters {
    botId?: string;
    dateRange?: AnalyticsDateRange;
}

export interface IAnalyticsOverview {
    totalConversations: number;
    completionRate: number;
    awaitingInputRate: number;
    averageMessagesPerConversation: number;
    averageConversationDurationSeconds: number;
    totalMessages: number;
    latestConversationAt?: string;
}

export interface IAnalyticsTimeseriesPoint {
    date: string;
    label: string;
    conversationCount: number;
}

export interface IAnalyticsTimeseries {
    points: IAnalyticsTimeseriesPoint[];
}

export interface IAnalyticsBreakdownItem {
    id: string;
    name: string;
    conversationCount: number;
    completedConversationCount: number;
    awaitingInputConversationCount: number;
    activeConversationCount: number;
    totalMessageCount: number;
}

export interface IAnalyticsBreakdown {
    topBots: IAnalyticsBreakdownItem[];
    topDeployments: IAnalyticsBreakdownItem[];
    completedCount: number;
    awaitingInputCount: number;
    activeCount: number;
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

const GET_ANALYTICS_OVERVIEW_URL = "/api/services/app/Analytics/GetAnalyticsOverview";
const GET_ANALYTICS_TIMESERIES_URL = "/api/services/app/Analytics/GetAnalyticsTimeseries";
const GET_ANALYTICS_BREAKDOWN_URL = "/api/services/app/Analytics/GetAnalyticsBreakdown";
const ANALYTICS_REQUEST_CONFIG = {
    skipUnauthorizedRedirect: true,
    skipForbiddenRedirect: true
} as IAxiosRedirectControlConfig;

/**
 * Loads aggregate analytics metrics for the current developer.
 */
export async function getAnalyticsOverview(filters: IAnalyticsFilters): Promise<IAnalyticsOverview> {
    const instance = getAxiosInstance();
    const response = await instance.get<IAbpAjaxResponse<IAnalyticsOverview>>(GET_ANALYTICS_OVERVIEW_URL, {
        ...ANALYTICS_REQUEST_CONFIG,
        params: buildAnalyticsQueryParams(filters)
    });

    return unwrapResponse(response.data, "We could not load analytics overview.");
}

/**
 * Loads daily conversation trend data for the current developer.
 */
export async function getAnalyticsTimeseries(filters: IAnalyticsFilters): Promise<IAnalyticsTimeseries> {
    const instance = getAxiosInstance();
    const response = await instance.get<IAbpAjaxResponse<IAnalyticsTimeseries>>(GET_ANALYTICS_TIMESERIES_URL, {
        ...ANALYTICS_REQUEST_CONFIG,
        params: buildAnalyticsQueryParams(filters)
    });

    return unwrapResponse(response.data, "We could not load analytics trends.");
}

/**
 * Loads grouped analytics breakdowns for the current developer.
 */
export async function getAnalyticsBreakdown(filters: IAnalyticsFilters): Promise<IAnalyticsBreakdown> {
    const instance = getAxiosInstance();
    const response = await instance.get<IAbpAjaxResponse<IAnalyticsBreakdown>>(GET_ANALYTICS_BREAKDOWN_URL, {
        ...ANALYTICS_REQUEST_CONFIG,
        params: buildAnalyticsQueryParams(filters)
    });

    return unwrapResponse(response.data, "We could not load analytics breakdowns.");
}

function buildAnalyticsQueryParams(filters: IAnalyticsFilters) {
    return {
        BotId: filters.botId,
        DateRange: filters.dateRange ?? "30d"
    };
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
