"use client";

import { handleActions } from "redux-actions";
import { BillingActionEnums } from "./actions";
import { INITIAL_STATE, type IBillingStateContext } from "./context";

interface IReducerAction {
    payload?: Partial<IBillingStateContext>;
}

export const BillingReducer = handleActions<IBillingStateContext, IBillingStateContext>(
    {
        [BillingActionEnums.getBillingPending]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BillingActionEnums.getBillingSuccess]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BillingActionEnums.getBillingError]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BillingActionEnums.confirmBillingPending]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BillingActionEnums.confirmBillingSuccess]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BillingActionEnums.confirmBillingError]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BillingActionEnums.cancelBillingPending]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BillingActionEnums.cancelBillingSuccess]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BillingActionEnums.cancelBillingError]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        })
    },
    INITIAL_STATE
);
