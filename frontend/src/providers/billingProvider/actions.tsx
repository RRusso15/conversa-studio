"use client";

import { createAction } from "redux-actions";
import type { IBillingOverview, IBillingPortalConfig } from "@/utils/billing-api";
import type { IBillingStateContext } from "./context";

type IBillingStatePatch = Partial<IBillingStateContext>;

export enum BillingActionEnums {
    getBillingPending = "GET_BILLING_PENDING",
    getBillingSuccess = "GET_BILLING_SUCCESS",
    getBillingError = "GET_BILLING_ERROR",
    confirmBillingPending = "CONFIRM_BILLING_PENDING",
    confirmBillingSuccess = "CONFIRM_BILLING_SUCCESS",
    confirmBillingError = "CONFIRM_BILLING_ERROR",
    cancelBillingPending = "CANCEL_BILLING_PENDING",
    cancelBillingSuccess = "CANCEL_BILLING_SUCCESS",
    cancelBillingError = "CANCEL_BILLING_ERROR"
}

export const getBillingPending = createAction<IBillingStatePatch>(
    BillingActionEnums.getBillingPending,
    () => ({
        status: "loading",
        errorMessage: undefined
    })
);

export const getBillingSuccess = createAction<
    IBillingStatePatch,
    {
        overview: IBillingOverview;
        portalConfig: IBillingPortalConfig;
    }
>(
    BillingActionEnums.getBillingSuccess,
    ({ overview, portalConfig }) => ({
        overview,
        portalConfig,
        status: "idle",
        errorMessage: undefined
    })
);

export const getBillingError = createAction<IBillingStatePatch, string>(
    BillingActionEnums.getBillingError,
    (message) => ({
        status: "error",
        errorMessage: message
    })
);

export const confirmBillingPending = createAction<IBillingStatePatch>(
    BillingActionEnums.confirmBillingPending,
    () => ({
        status: "confirming",
        errorMessage: undefined
    })
);

export const confirmBillingSuccess = createAction<IBillingStatePatch, IBillingOverview>(
    BillingActionEnums.confirmBillingSuccess,
    (overview) => ({
        overview,
        status: "idle",
        errorMessage: undefined
    })
);

export const confirmBillingError = createAction<IBillingStatePatch, string>(
    BillingActionEnums.confirmBillingError,
    (message) => ({
        status: "error",
        errorMessage: message
    })
);

export const cancelBillingPending = createAction<IBillingStatePatch>(
    BillingActionEnums.cancelBillingPending,
    () => ({
        status: "cancelling",
        errorMessage: undefined
    })
);

export const cancelBillingSuccess = createAction<IBillingStatePatch, IBillingOverview>(
    BillingActionEnums.cancelBillingSuccess,
    (overview) => ({
        overview,
        status: "idle",
        errorMessage: undefined
    })
);

export const cancelBillingError = createAction<IBillingStatePatch, string>(
    BillingActionEnums.cancelBillingError,
    (message) => ({
        status: "error",
        errorMessage: message
    })
);
