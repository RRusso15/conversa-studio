"use strict";

import { getAxiosInstance, type IAxiosRedirectControlConfig } from "./axiosInstance";

export interface ITranscriptSessionSummary {
    id: string;
    botId: string;
    botName: string;
    deploymentId: string;
    deploymentName: string;
    sessionToken: string;
    createdAt: string;
    updatedAt: string;
    awaitingInput: boolean;
    isCompleted: boolean;
    publishedVersion: number;
    messageCount: number;
    lastMessagePreview: string;
}

export interface ITranscriptMessage {
    id: string;
    role: string;
    content: string;
    createdAt: string;
}

export interface ITranscriptDetail extends ITranscriptSessionSummary {
    messages: ITranscriptMessage[];
}

export interface ITranscriptFilters {
    botId?: string;
    status?: "all" | "completed" | "awaiting_input";
    searchText?: string;
    skipCount?: number;
    maxResultCount?: number;
}

export interface ITranscriptListResult {
    totalCount: number;
    items: ITranscriptSessionSummary[];
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

const GET_TRANSCRIPTS_URL = "/api/services/app/Transcript/GetTranscripts";
const GET_TRANSCRIPT_URL = "/api/services/app/Transcript/GetTranscript";
const TRANSCRIPT_REQUEST_CONFIG = {
    skipUnauthorizedRedirect: true,
    skipForbiddenRedirect: true
} as IAxiosRedirectControlConfig;

/**
 * Loads paged transcript session summaries.
 */
export async function getTranscripts(filters: ITranscriptFilters): Promise<ITranscriptListResult> {
    const instance = getAxiosInstance();
    const response = await instance.get<IAbpAjaxResponse<ITranscriptListResult>>(GET_TRANSCRIPTS_URL, {
        ...TRANSCRIPT_REQUEST_CONFIG,
        params: {
            BotId: filters.botId,
            Status: normalizeStatus(filters.status),
            SearchText: filters.searchText?.trim() || undefined,
            SkipCount: filters.skipCount ?? 0,
            MaxResultCount: filters.maxResultCount ?? 20
        }
    });

    return unwrapResponse(response.data, "We could not load transcripts.");
}

/**
 * Loads one transcript detail by runtime session identifier.
 */
export async function getTranscript(id: string): Promise<ITranscriptDetail> {
    const instance = getAxiosInstance();
    const response = await instance.get<IAbpAjaxResponse<ITranscriptDetail>>(
        `${GET_TRANSCRIPT_URL}?Id=${encodeURIComponent(id)}`,
        TRANSCRIPT_REQUEST_CONFIG
    );

    return unwrapResponse(response.data, "We could not load this transcript.");
}

function normalizeStatus(status?: ITranscriptFilters["status"]): string | undefined {
    if (!status || status === "all") {
        return undefined;
    }

    return status;
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
