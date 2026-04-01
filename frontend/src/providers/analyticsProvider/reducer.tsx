"use client";

import { handleActions } from "redux-actions";
import { AnalyticsActionEnums } from "./actions";
import { INITIAL_STATE, type IAnalyticsStateContext } from "./context";

interface IReducerAction {
    payload?: Partial<IAnalyticsStateContext>;
}

export const AnalyticsReducer = handleActions<IAnalyticsStateContext, IAnalyticsStateContext>(
    {
        [AnalyticsActionEnums.getAnalyticsPending]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [AnalyticsActionEnums.getAnalyticsSuccess]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [AnalyticsActionEnums.getAnalyticsError]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [AnalyticsActionEnums.setAnalyticsFilters]: (state, action: IReducerAction) => ({
            ...state,
            filters: {
                ...state.filters,
                ...action.payload?.filters
            }
        })
    },
    INITIAL_STATE
);
