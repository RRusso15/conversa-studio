"use client";

import { useCallback, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { Action } from "redux-actions";
import {
    cancelSubscription as cancelSubscriptionRequest,
    confirmPayPalSubscription as confirmPayPalSubscriptionRequest,
    getBillingOverview as getBillingOverviewRequest,
    getBillingPortalConfig as getBillingPortalConfigRequest
} from "@/utils/billing-api";
import {
    cancelBillingError,
    cancelBillingPending,
    cancelBillingSuccess,
    confirmBillingError,
    confirmBillingPending,
    confirmBillingSuccess,
    getBillingError,
    getBillingPending,
    getBillingSuccess
} from "./actions";
import {
    BillingActionContext,
    BillingStateContext,
    INITIAL_STATE,
    type IBillingStateContext
} from "./context";
import { BillingReducer } from "./reducer";

interface BillingProviderProps {
    children: ReactNode;
}

/**
 * Provides tenant billing state and actions for the developer workspace.
 */
export const BillingProvider = ({ children }: BillingProviderProps) => {
    const [state, rawDispatch] = useReducer(BillingReducer, INITIAL_STATE);
    const dispatch = rawDispatch as React.Dispatch<Action<Partial<IBillingStateContext>>>;

    const getBilling = useCallback(async (): Promise<void> => {
        dispatch(getBillingPending());

        try {
            const [overview, portalConfig] = await Promise.all([
                getBillingOverviewRequest(),
                getBillingPortalConfigRequest()
            ]);

            dispatch(getBillingSuccess({
                overview,
                portalConfig
            }));
        } catch (error) {
            dispatch(getBillingError(toBillingErrorMessage(error, "We could not load billing.")));
        }
    }, [dispatch]);

    const confirmPayPalSubscription = useCallback(async (subscriptionId: string): Promise<void> => {
        dispatch(confirmBillingPending());

        try {
            const overview = await confirmPayPalSubscriptionRequest(subscriptionId);
            dispatch(confirmBillingSuccess(overview));
        } catch (error) {
            dispatch(confirmBillingError(toBillingErrorMessage(error, "We could not confirm your PayPal subscription.")));
            throw error;
        }
    }, [dispatch]);

    const cancelSubscription = useCallback(async (): Promise<void> => {
        dispatch(cancelBillingPending());

        try {
            const overview = await cancelSubscriptionRequest();
            dispatch(cancelBillingSuccess(overview));
        } catch (error) {
            dispatch(cancelBillingError(toBillingErrorMessage(error, "We could not cancel your subscription.")));
            throw error;
        }
    }, [dispatch]);

    const actionValue = useMemo(() => ({
        getBilling,
        confirmPayPalSubscription,
        cancelSubscription
    }), [cancelSubscription, confirmPayPalSubscription, getBilling]);

    return (
        <BillingStateContext.Provider value={state}>
            <BillingActionContext.Provider value={actionValue}>
                {children}
            </BillingActionContext.Provider>
        </BillingStateContext.Provider>
    );
};

export const useBillingState = () => {
    const context = useContext(BillingStateContext);

    if (!context) {
        throw new Error("useBillingState must be used within a BillingProvider");
    }

    return context;
};

export const useBillingActions = () => {
    const context = useContext(BillingActionContext);

    if (!context) {
        throw new Error("useBillingActions must be used within a BillingProvider");
    }

    return context;
};

function toBillingErrorMessage(error: unknown, fallbackMessage: string): string {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response
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

        return data.error?.validationErrors
            ?.map((validationError) => validationError.message)
            .filter((message): message is string => Boolean(message))
            .join(" ")
            ?? data.error?.details
            ?? data.error?.message
            ?? fallbackMessage;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallbackMessage;
}
