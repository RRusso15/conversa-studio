"use client";

import type { BotGraph, ValidationResult } from "@/components/developer/builder/types";
import { getAxiosInstance, type IAxiosRedirectControlConfig } from "./axiosInstance";

interface IAbpAjaxResponse<T> {
    result?: T;
    success: boolean;
    targetUrl?: string;
    error?: {
        message?: string;
        details?: string;
        validationErrors?: Array<{
            message?: string;
        }>;
    };
}

interface IListResultDto<T> {
    items: T[];
}

interface IApiTemplateSummary {
    id: string;
    name: string;
    description: string;
    category: string;
    status: string;
    draftVersion: number;
    publishedVersion?: number;
    hasUnpublishedChanges: boolean;
    updatedAt: string;
}

interface IApiTemplateDefinition extends IApiTemplateSummary {
    graph: BotGraph;
}

export interface ITemplateSummary {
    id: string;
    name: string;
    description: string;
    category: string;
    status: "draft" | "published";
    draftVersion: number;
    publishedVersion?: number;
    hasUnpublishedChanges: boolean;
    updatedAt: string;
}

export interface ITemplateDefinition extends ITemplateSummary {
    graph: BotGraph;
}

export interface ITemplateMutationInput {
    name: string;
    description: string;
    category: string;
    graph: BotGraph;
}

export interface ITemplateApiError {
    message: string;
    status?: number;
}

const TEMPLATE_REQUEST_CONFIG = {
    skipUnauthorizedRedirect: true,
    skipForbiddenRedirect: true
} as IAxiosRedirectControlConfig;

const TEMPLATE_GET_PUBLISHED_URL = "/api/services/app/TemplateDefinition/GetPublishedTemplates";
const TEMPLATE_GET_ADMIN_URL = "/api/services/app/TemplateDefinition/GetAdminTemplates";
const TEMPLATE_GET_PUBLISHED_SINGLE_URL = "/api/services/app/TemplateDefinition/GetPublishedTemplate";
const TEMPLATE_GET_SINGLE_URL = "/api/services/app/TemplateDefinition/GetTemplate";
const TEMPLATE_CREATE_URL = "/api/services/app/TemplateDefinition/CreateDraft";
const TEMPLATE_UPDATE_URL = "/api/services/app/TemplateDefinition/UpdateDraft";
const TEMPLATE_PUBLISH_URL = "/api/services/app/TemplateDefinition/PublishDraft";
const TEMPLATE_UNPUBLISH_URL = "/api/services/app/TemplateDefinition/Unpublish";
const TEMPLATE_DUPLICATE_URL = "/api/services/app/TemplateDefinition/DuplicateTemplate";
const TEMPLATE_DELETE_URL = "/api/services/app/TemplateDefinition/DeleteTemplate";
const TEMPLATE_VALIDATE_URL = "/api/services/app/TemplateDefinition/ValidateDraft";

export async function getPublishedTemplates(): Promise<ITemplateSummary[]> {
    const instance = getAxiosInstance();
    const response = await instance.get<IAbpAjaxResponse<IListResultDto<IApiTemplateSummary>>>(TEMPLATE_GET_PUBLISHED_URL, TEMPLATE_REQUEST_CONFIG);
    return unwrapResponse(response.data, "We could not load templates.").items.map(mapSummary);
}

export async function getAdminTemplates(): Promise<ITemplateSummary[]> {
    const instance = getAxiosInstance();
    const response = await instance.get<IAbpAjaxResponse<IListResultDto<IApiTemplateSummary>>>(TEMPLATE_GET_ADMIN_URL, TEMPLATE_REQUEST_CONFIG);
    return unwrapResponse(response.data, "We could not load templates.").items.map(mapSummary);
}

export async function getPublishedTemplate(id: string): Promise<ITemplateDefinition> {
    const instance = getAxiosInstance();
    const response = await instance.get<IAbpAjaxResponse<IApiTemplateDefinition>>(
        `${TEMPLATE_GET_PUBLISHED_SINGLE_URL}?Id=${encodeURIComponent(id)}`,
        TEMPLATE_REQUEST_CONFIG
    );
    return mapDefinition(unwrapResponse(response.data, "We could not load this template."));
}

export async function getTemplate(id: string): Promise<ITemplateDefinition> {
    const instance = getAxiosInstance();
    const response = await instance.get<IAbpAjaxResponse<IApiTemplateDefinition>>(
        `${TEMPLATE_GET_SINGLE_URL}?Id=${encodeURIComponent(id)}`,
        TEMPLATE_REQUEST_CONFIG
    );
    return mapDefinition(unwrapResponse(response.data, "We could not load this template."));
}

export async function createTemplateDraft(input: ITemplateMutationInput): Promise<ITemplateDefinition> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IApiTemplateDefinition>>(TEMPLATE_CREATE_URL, input, TEMPLATE_REQUEST_CONFIG);
    return mapDefinition(unwrapResponse(response.data, "We could not create this template."));
}

export async function updateTemplateDraft(id: string, input: ITemplateMutationInput): Promise<ITemplateDefinition> {
    const instance = getAxiosInstance();
    const response = await instance.put<IAbpAjaxResponse<IApiTemplateDefinition>>(
        TEMPLATE_UPDATE_URL,
        {
            id,
            ...input
        },
        TEMPLATE_REQUEST_CONFIG
    );
    return mapDefinition(unwrapResponse(response.data, "We could not save this template."));
}

export async function publishTemplateDraft(id: string): Promise<ITemplateDefinition> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IApiTemplateDefinition>>(TEMPLATE_PUBLISH_URL, { id }, TEMPLATE_REQUEST_CONFIG);
    return mapDefinition(unwrapResponse(response.data, "We could not publish this template."));
}

export async function unpublishTemplateDraft(id: string): Promise<ITemplateDefinition> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IApiTemplateDefinition>>(TEMPLATE_UNPUBLISH_URL, { id }, TEMPLATE_REQUEST_CONFIG);
    return mapDefinition(unwrapResponse(response.data, "We could not unpublish this template."));
}

export async function duplicateTemplate(id: string): Promise<ITemplateDefinition> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IApiTemplateDefinition>>(TEMPLATE_DUPLICATE_URL, { id }, TEMPLATE_REQUEST_CONFIG);
    return mapDefinition(unwrapResponse(response.data, "We could not duplicate this template."));
}

export async function deleteTemplate(id: string): Promise<void> {
    const instance = getAxiosInstance();
    await instance.post(TEMPLATE_DELETE_URL, { id }, TEMPLATE_REQUEST_CONFIG);
}

export async function validateTemplateDraft(graph: BotGraph): Promise<ValidationResult[]> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IListResultDto<ValidationResult>>>(
        TEMPLATE_VALIDATE_URL,
        { graph },
        TEMPLATE_REQUEST_CONFIG
    );
    return unwrapResponse(response.data, "We could not validate this template.").items;
}

export function toTemplateApiError(error: unknown, fallbackMessage: string): ITemplateApiError {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response
    ) {
        const response = error.response as { data?: IAbpAjaxResponse<unknown>; status?: number };
        const data = response.data;
        const validationMessage = data?.error?.validationErrors
            ?.map((validationError) => validationError.message)
            .filter((message): message is string => Boolean(message))
            .join(" ");

        return {
            message: validationMessage ?? data?.error?.details ?? data?.error?.message ?? fallbackMessage,
            status: response.status
        };
    }

    if (error instanceof Error && error.message) {
        return { message: error.message };
    }

    return { message: fallbackMessage };
}

function mapSummary(template: IApiTemplateSummary): ITemplateSummary {
    return {
        ...template,
        status: template.status.toLowerCase() === "published" ? "published" : "draft"
    };
}

function mapDefinition(template: IApiTemplateDefinition): ITemplateDefinition {
    return {
        ...mapSummary(template),
        graph: template.graph
    };
}

function unwrapResponse<T>(payload: IAbpAjaxResponse<T> | T, fallbackMessage: string): T {
    if (typeof payload === "object" && payload !== null && "__abp" in payload) {
        const response = payload as IAbpAjaxResponse<T>;
        if (response.result !== undefined) {
            return response.result;
        }

        throw new Error(response.error?.message ?? fallbackMessage);
    }

    return payload as T;
}
