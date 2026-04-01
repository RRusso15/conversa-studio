"use client";

import { createAction } from "redux-actions";
import type {
    IAnalyticsBreakdown,
    IAnalyticsOverview,
    IAnalyticsTimeseries
} from "@/utils/analytics-api";
import type {
    IAnalyticsRequestError,
    IAnalyticsStateContext
} from "./context";

type IAnalyticsStatePatch = Partial<IAnalyticsStateContext>;

export enum AnalyticsActionEnums {
    getAnalyticsPending = "GET_ANALYTICS_PENDING",
    getAnalyticsSuccess = "GET_ANALYTICS_SUCCESS",
    getAnalyticsError = "GET_ANALYTICS_ERROR",
    setAnalyticsFilters = "SET_ANALYTICS_FILTERS"
}

export const getAnalyticsPending = createAction<IAnalyticsStatePatch>(
    AnalyticsActionEnums.getAnalyticsPending,
    () => ({
        status: "loading",
        errorMessage: undefined
    })
);

export const getAnalyticsSuccess = createAction<
    IAnalyticsStatePatch,
    {
        overview: IAnalyticsOverview;
        timeseries: IAnalyticsTimeseries;
        breakdown: IAnalyticsBreakdown;
    }
>(
    AnalyticsActionEnums.getAnalyticsSuccess,
    ({ overview, timeseries, breakdown }) => ({
        overview,
        timeseries,
        breakdown,
        status: "idle",
        errorMessage: undefined
    })
);

export const getAnalyticsError = createAction<IAnalyticsStatePatch, IAnalyticsRequestError | undefined>(
    AnalyticsActionEnums.getAnalyticsError,
    (error) => ({
        status: "error",
        errorMessage: error?.message
    })
);

export const setAnalyticsFilters = createAction<IAnalyticsStatePatch, Partial<IAnalyticsStateContext["filters"]>>(
    AnalyticsActionEnums.setAnalyticsFilters,
    (filters) => ({
        filters
    } as unknown as IAnalyticsStatePatch)
);
