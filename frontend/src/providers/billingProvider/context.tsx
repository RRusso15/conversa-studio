"use client";

import { createContext } from "react";
import type { IBillingOverview, IBillingPortalConfig } from "@/utils/billing-api";

export type BillingRequestStatus = "idle" | "loading" | "confirming" | "cancelling" | "error";

export interface IBillingStateContext {
    overview?: IBillingOverview;
    portalConfig?: IBillingPortalConfig;
    status: BillingRequestStatus;
    errorMessage?: string;
}

export interface IBillingActionContext {
    getBilling: () => Promise<void>;
    confirmPayPalSubscription: (subscriptionId: string) => Promise<void>;
    cancelSubscription: () => Promise<void>;
}

export const INITIAL_STATE: IBillingStateContext = {
    status: "idle"
};

export const INITIAL_ACTION_STATE: IBillingActionContext = {
    getBilling: async () => undefined,
    confirmPayPalSubscription: async () => undefined,
    cancelSubscription: async () => undefined
};

export const BillingStateContext = createContext<IBillingStateContext>(INITIAL_STATE);

export const BillingActionContext = createContext<IBillingActionContext | undefined>(undefined);
