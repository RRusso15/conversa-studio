"use client";

import { createContext } from "react";
import type {
    ITranscriptDetail,
    ITranscriptFilters,
    ITranscriptSessionSummary
} from "@/utils/transcript-api";

export type TranscriptRequestErrorCode =
    | "unauthorized"
    | "forbidden"
    | "method_not_allowed"
    | "server_error"
    | "network_error"
    | "unknown";

export interface ITranscriptRequestError {
    code: TranscriptRequestErrorCode;
    message: string;
    status?: number;
}

export interface ITranscriptStateContext {
    sessions?: ITranscriptSessionSummary[];
    totalCount: number;
    selectedTranscript?: ITranscriptDetail;
    selectedTranscriptId?: string;
    filters: Required<Pick<ITranscriptFilters, "status" | "searchText" | "skipCount" | "maxResultCount">> & Pick<ITranscriptFilters, "botId">;
    listStatus: "idle" | "loading" | "error";
    detailStatus: "idle" | "loading" | "error";
    listErrorMessage?: string;
    detailErrorMessage?: string;
}

export interface ITranscriptActionContext {
    getTranscripts: () => Promise<void>;
    getTranscript: (id: string) => Promise<ITranscriptDetail | undefined>;
    setTranscriptFilters: (filters: Partial<ITranscriptStateContext["filters"]>) => void;
    clearSelectedTranscript: () => void;
}

export const INITIAL_STATE: ITranscriptStateContext = {
    totalCount: 0,
    filters: {
        botId: undefined,
        status: "all",
        searchText: "",
        skipCount: 0,
        maxResultCount: 20
    },
    listStatus: "idle",
    detailStatus: "idle"
};

export const INITIAL_ACTION_STATE: ITranscriptActionContext = {
    getTranscripts: async () => undefined,
    getTranscript: async () => undefined,
    setTranscriptFilters: () => undefined,
    clearSelectedTranscript: () => undefined
};

export const TranscriptStateContext =
    createContext<ITranscriptStateContext>(INITIAL_STATE);

export const TranscriptActionContext =
    createContext<ITranscriptActionContext | undefined>(undefined);
