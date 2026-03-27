"use client";

import { getAxiosInstance, type IAxiosRedirectControlConfig } from "@/utils/axiosInstance";

export interface IDeploymentRequestError {
    code: "unauthorized" | "forbidden" | "server_error" | "network_error" | "unknown";
    message: string;
    status?: number;
}

export interface IDeploymentDefinition {
    id: string;
    botDefinitionId: string;
    botName: string;
    name: string;
    channelType: string;
    status: string;
    deploymentKey: string;
    allowedDomains: string[];
    launcherLabel: string;
    themeColor: string;
    updatedAt: string;
}

export interface IDeploymentSnippet {
    deploymentKey: string;
    snippet: string;
}

interface IAbpAjaxResponse<T> {
    result?: T;
    success: boolean;
    error?: {
        message?: string;
        details?: string;
    };
}

interface IListResultDto<T> {
    items: T[];
}

const GET_DEPLOYMENTS_URL = "/api/services/app/BotDeployment/GetDeployments";
const GET_DEPLOYMENT_URL = "/api/services/app/BotDeployment/GetDeployment";
const CREATE_DEPLOYMENT_URL = "/api/services/app/BotDeployment/CreateWidgetDeployment";
const UPDATE_DEPLOYMENT_URL = "/api/services/app/BotDeployment/UpdateWidgetDeployment";
const ACTIVATE_DEPLOYMENT_URL = "/api/services/app/BotDeployment/Activate";
const DEACTIVATE_DEPLOYMENT_URL = "/api/services/app/BotDeployment/Deactivate";
const GET_SNIPPET_URL = "/api/services/app/BotDeployment/GetInstallSnippet";
const REQUEST_CONFIG = {
    skipUnauthorizedRedirect: true,
    skipForbiddenRedirect: true
} as IAxiosRedirectControlConfig;

export async function getDeployments(): Promise<IDeploymentDefinition[]> {
    const instance = getAxiosInstance();
    const response = await instance.get<IAbpAjaxResponse<IListResultDto<IDeploymentDefinition>>>(
        GET_DEPLOYMENTS_URL,
        REQUEST_CONFIG
    );

    return unwrapResponse(response.data, "We could not load deployments.").items;
}

export async function createDeployment(payload: {
    botDefinitionId: string;
    name: string;
    allowedDomains: string[];
    launcherLabel: string;
    themeColor: string;
}): Promise<IDeploymentDefinition> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IDeploymentDefinition>>(
        CREATE_DEPLOYMENT_URL,
        payload,
        REQUEST_CONFIG
    );

    return unwrapResponse(response.data, "We could not create this deployment.");
}

export async function updateDeployment(payload: {
    id: string;
    name: string;
    allowedDomains: string[];
    launcherLabel: string;
    themeColor: string;
}): Promise<IDeploymentDefinition> {
    const instance = getAxiosInstance();
    const response = await instance.put<IAbpAjaxResponse<IDeploymentDefinition>>(
        UPDATE_DEPLOYMENT_URL,
        payload,
        REQUEST_CONFIG
    );

    return unwrapResponse(response.data, "We could not update this deployment.");
}

export async function activateDeployment(id: string): Promise<IDeploymentDefinition> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IDeploymentDefinition>>(
        ACTIVATE_DEPLOYMENT_URL,
        { id },
        REQUEST_CONFIG
    );

    return unwrapResponse(response.data, "We could not activate this deployment.");
}

export async function deactivateDeployment(id: string): Promise<IDeploymentDefinition> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IDeploymentDefinition>>(
        DEACTIVATE_DEPLOYMENT_URL,
        { id },
        REQUEST_CONFIG
    );

    return unwrapResponse(response.data, "We could not deactivate this deployment.");
}

export async function getDeploymentSnippet(id: string): Promise<IDeploymentSnippet> {
    const instance = getAxiosInstance();
    const response = await instance.get<IAbpAjaxResponse<IDeploymentSnippet>>(
        `${GET_SNIPPET_URL}?Id=${encodeURIComponent(id)}`,
        REQUEST_CONFIG
    );

    return unwrapResponse(response.data, "We could not load the install snippet.");
}

export function toDeploymentRequestError(error: unknown, fallbackMessage: string): IDeploymentRequestError {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        "status" in error.response
    ) {
        const data = error.response.data as IAbpAjaxResponse<unknown>;
        const status = error.response.status as number | undefined;
        const message = data.error?.details ?? data.error?.message ?? fallbackMessage;

        if (status === 401) {
            return { code: "unauthorized", status, message: "Your session has expired. Please sign in again." };
        }

        if (status === 403) {
            return { code: "forbidden", status, message: "You do not have permission to manage deployments." };
        }

        if (status !== undefined && status >= 500) {
            return { code: "server_error", status, message };
        }

        return { code: "unknown", status, message };
    }

    if (error instanceof Error) {
        return { code: "network_error", message: error.message };
    }

    return { code: "unknown", message: fallbackMessage };
}

function unwrapResponse<T>(payload: IAbpAjaxResponse<T> | T, fallbackMessage: string): T {
    if (typeof payload === "object" && payload !== null && "__abp" in payload) {
        const ajaxPayload = payload as IAbpAjaxResponse<T>;

        if (ajaxPayload.result !== undefined) {
            return ajaxPayload.result;
        }

        throw new Error(ajaxPayload.error?.message ?? fallbackMessage);
    }

    return payload as T;
}
