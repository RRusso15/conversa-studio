"use client";

import { getAxiosInstance, type IAxiosRedirectControlConfig } from "./axiosInstance";

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

export interface IAiKnowledgeSource {
    id: string;
    sourceType: string;
    title: string;
    status: string;
    failureReason: string;
    sourceUrl: string;
    sourceFileName: string;
    lastIngestedAtUtc?: string;
    chunkCount: number;
}

export interface IAiKnowledgeStatus {
    botId: string;
    provider: string;
    generationModel: string;
    embeddingModel: string;
    hasApiKey: boolean;
    sourceCount: number;
    readySourceCount: number;
    isKnowledgeConfigured: boolean;
    sources: IAiKnowledgeSource[];
}

const BOT_AI_KNOWLEDGE_GET_URL = "/api/services/app/BotAiKnowledge/Get";
const BOT_AI_KNOWLEDGE_UPSERT_URL = "/api/services/app/BotAiKnowledge/UpsertSettingsAsync";
const BOT_AI_KNOWLEDGE_ADD_TEXT_URL = "/api/services/app/BotAiKnowledge/AddTextSourceAsync";
const BOT_AI_KNOWLEDGE_ADD_URL_URL = "/api/services/app/BotAiKnowledge/AddUrlSourceAsync";
const BOT_AI_KNOWLEDGE_ADD_PDF_URL = "/api/services/app/BotAiKnowledge/AddPdfSourceAsync";
const BOT_AI_KNOWLEDGE_REINGEST_URL = "/api/services/app/BotAiKnowledge/ReingestSourceAsync";
const BOT_AI_KNOWLEDGE_DELETE_URL = "/api/services/app/BotAiKnowledge/DeleteSourceAsync";

const REQUEST_CONFIG = {
    skipUnauthorizedRedirect: true,
    skipForbiddenRedirect: true
} as IAxiosRedirectControlConfig;

export async function getBotAiKnowledge(botId: string): Promise<IAiKnowledgeStatus> {
    const instance = getAxiosInstance();
    const response = await instance.get<IAbpAjaxResponse<IAiKnowledgeStatus>>(
        `${BOT_AI_KNOWLEDGE_GET_URL}?Id=${encodeURIComponent(botId)}`,
        REQUEST_CONFIG
    );

    return unwrapResponse(response.data, "We could not load the AI knowledge settings for this bot.");
}

export async function upsertBotAiSettings(input: {
    botId: string;
    apiKey: string;
    generationModel: string;
    embeddingModel: string;
}): Promise<IAiKnowledgeStatus> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IAiKnowledgeStatus>>(
        BOT_AI_KNOWLEDGE_UPSERT_URL,
        {
            botId: input.botId,
            apiKey: input.apiKey,
            generationModel: input.generationModel,
            embeddingModel: input.embeddingModel
        },
        REQUEST_CONFIG
    );

    return unwrapResponse(response.data, "We could not save the AI settings for this bot.");
}

export async function addBotAiTextSource(input: {
    botId: string;
    title: string;
    text: string;
}): Promise<IAiKnowledgeStatus> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IAiKnowledgeStatus>>(
        BOT_AI_KNOWLEDGE_ADD_TEXT_URL,
        input,
        REQUEST_CONFIG
    );

    return unwrapResponse(response.data, "We could not add that text knowledge source.");
}

export async function addBotAiUrlSource(input: {
    botId: string;
    title: string;
    url: string;
}): Promise<IAiKnowledgeStatus> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IAiKnowledgeStatus>>(
        BOT_AI_KNOWLEDGE_ADD_URL_URL,
        input,
        REQUEST_CONFIG
    );

    return unwrapResponse(response.data, "We could not add that URL knowledge source.");
}

export async function addBotAiPdfSource(input: {
    botId: string;
    title: string;
    fileName: string;
    base64Content: string;
}): Promise<IAiKnowledgeStatus> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IAiKnowledgeStatus>>(
        BOT_AI_KNOWLEDGE_ADD_PDF_URL,
        input,
        REQUEST_CONFIG
    );

    return unwrapResponse(response.data, "We could not add that PDF knowledge source.");
}

export async function reingestBotAiSource(botId: string, sourceId: string): Promise<IAiKnowledgeStatus> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IAiKnowledgeStatus>>(
        BOT_AI_KNOWLEDGE_REINGEST_URL,
        { botId, sourceId },
        REQUEST_CONFIG
    );

    return unwrapResponse(response.data, "We could not re-ingest that knowledge source.");
}

export async function deleteBotAiSource(botId: string, sourceId: string): Promise<IAiKnowledgeStatus> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IAiKnowledgeStatus>>(
        BOT_AI_KNOWLEDGE_DELETE_URL,
        { botId, sourceId },
        REQUEST_CONFIG
    );

    return unwrapResponse(response.data, "We could not remove that knowledge source.");
}

function unwrapResponse<T>(payload: IAbpAjaxResponse<T> | T, fallbackMessage: string): T {
    if (typeof payload === "object" && payload !== null && "__abp" in payload) {
        const abpPayload = payload as IAbpAjaxResponse<T>;
        if (abpPayload.result !== undefined) {
            return abpPayload.result;
        }

        const validationMessage = abpPayload.error?.validationErrors
            ?.map((error) => error.message)
            .filter((message): message is string => Boolean(message))
            .join(" ");

        throw new Error(validationMessage ?? abpPayload.error?.details ?? abpPayload.error?.message ?? fallbackMessage);
    }

    return payload as T;
}
