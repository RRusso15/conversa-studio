"use strict";

import { getAxiosInstance, type IAxiosRedirectControlConfig } from "./axiosInstance";

export interface IBillingOverview {
    planCode: string;
    planName: string;
    status: string;
    provider: string;
    priceLabel: string;
    trialLabel: string;
    providerSubscriptionId?: string;
    trialEndsAt?: string;
    currentPeriodStartAt?: string;
    currentPeriodEndAt?: string;
    canceledAt?: string;
    lastSyncedAt?: string;
    payerEmail?: string;
    subscriberName?: string;
    canStartSubscription: boolean;
    canCancelSubscription: boolean;
}

export interface IBillingPortalConfig {
    provider: string;
    clientId: string;
    planId: string;
    environment: "sandbox" | "live" | string;
    planCode: string;
    planName: string;
    priceLabel: string;
    trialLabel: string;
    isAvailable: boolean;
    unavailableReason?: string;
}

interface IAbpAjaxResponse<T> {
    result?: T;
    success: boolean;
    error?: {
        message?: string;
        details?: string;
        validationErrors?: Array<{
            message?: string;
        }>;
    };
}

const BILLING_REQUEST_CONFIG = {
    skipUnauthorizedRedirect: true,
    skipForbiddenRedirect: true
} as IAxiosRedirectControlConfig;
const GET_BILLING_OVERVIEW_URL = "/api/services/app/Billing/GetBillingOverview";
const GET_BILLING_PORTAL_CONFIG_URL = "/api/services/app/Billing/GetBillingPortalConfig";
const CONFIRM_PAYPAL_SUBSCRIPTION_URL = "/api/services/app/Billing/ConfirmPayPalSubscription";
const CANCEL_SUBSCRIPTION_URL = "/api/services/app/Billing/CancelSubscription";

/**
 * Loads the current tenant billing summary.
 */
export async function getBillingOverview(): Promise<IBillingOverview> {
    const instance = getAxiosInstance();
    const response = await instance.get<IAbpAjaxResponse<IBillingOverview>>(GET_BILLING_OVERVIEW_URL, BILLING_REQUEST_CONFIG);
    return unwrapResponse(response.data, "We could not load billing.");
}

/**
 * Loads the current PayPal client configuration for the billing page.
 */
export async function getBillingPortalConfig(): Promise<IBillingPortalConfig> {
    const instance = getAxiosInstance();
    const response = await instance.get<IAbpAjaxResponse<IBillingPortalConfig>>(GET_BILLING_PORTAL_CONFIG_URL, BILLING_REQUEST_CONFIG);
    return unwrapResponse(response.data, "We could not load PayPal configuration.");
}

/**
 * Persists and verifies a PayPal subscription approval.
 */
export async function confirmPayPalSubscription(subscriptionId: string): Promise<IBillingOverview> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IBillingOverview>>(
        CONFIRM_PAYPAL_SUBSCRIPTION_URL,
        {
            subscriptionId
        },
        BILLING_REQUEST_CONFIG
    );

    return unwrapResponse(response.data, "We could not confirm this PayPal subscription.");
}

/**
 * Cancels the current tenant subscription.
 */
export async function cancelSubscription(): Promise<IBillingOverview> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IBillingOverview>>(CANCEL_SUBSCRIPTION_URL, {}, BILLING_REQUEST_CONFIG);
    return unwrapResponse(response.data, "We could not cancel this subscription.");
}

function unwrapResponse<T>(payload: IAbpAjaxResponse<T> | T, fallbackMessage: string): T {
    if (isAbpAjaxResponse(payload)) {
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
