"use client";

import type { BotGraph } from "@/components/developer/builder/types";
import { getAxiosInstance, type IAxiosRedirectControlConfig } from "./axiosInstance";

interface IAbpAjaxResponse<T> {
    result?: T;
    success: boolean;
    error?: {
        message?: string;
        details?: string;
    };
}

interface IGeneratedBotGraphResponse {
    graph: BotGraph;
    model: string;
    notes: string[];
}

export interface IGeneratedBotGraph {
    graph: BotGraph;
    model: string;
    notes: string[];
}

const BOT_GENERATION_URL = "/api/services/app/BotGeneration/GenerateFromPrompt";
const REQUEST_CONFIG = {
    skipUnauthorizedRedirect: true,
    skipForbiddenRedirect: true
} as IAxiosRedirectControlConfig;

export async function generateBotGraphFromPrompt(input: {
    prompt: string;
    botName: string;
    apiKey: string;
}): Promise<IGeneratedBotGraph> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IGeneratedBotGraphResponse>>(BOT_GENERATION_URL, input, REQUEST_CONFIG);
    const payload = unwrapResponse(response.data, "We could not generate a bot from that prompt.");

    return {
        graph: payload.graph,
        model: payload.model,
        notes: payload.notes ?? []
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
