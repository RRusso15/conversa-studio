"use client";

import { createAction } from "redux-actions";
import type {
    ITranscriptDetail,
    ITranscriptListResult
} from "@/utils/transcript-api";
import type {
    ITranscriptRequestError,
    ITranscriptStateContext
} from "./context";

type ITranscriptStatePatch = Partial<ITranscriptStateContext>;

export enum TranscriptActionEnums {
    getTranscriptsPending = "GET_TRANSCRIPTS_PENDING",
    getTranscriptsSuccess = "GET_TRANSCRIPTS_SUCCESS",
    getTranscriptsError = "GET_TRANSCRIPTS_ERROR",

    getTranscriptPending = "GET_TRANSCRIPT_PENDING",
    getTranscriptSuccess = "GET_TRANSCRIPT_SUCCESS",
    getTranscriptError = "GET_TRANSCRIPT_ERROR",

    setTranscriptFilters = "SET_TRANSCRIPT_FILTERS",
    clearSelectedTranscript = "CLEAR_SELECTED_TRANSCRIPT"
}

export const getTranscriptsPending = createAction<ITranscriptStatePatch>(
    TranscriptActionEnums.getTranscriptsPending,
    () => ({
        listStatus: "loading",
        listErrorMessage: undefined
    })
);

export const getTranscriptsSuccess = createAction<ITranscriptStatePatch, ITranscriptListResult>(
    TranscriptActionEnums.getTranscriptsSuccess,
    ({ totalCount, items }) => ({
        sessions: items,
        totalCount,
        listStatus: "idle",
        listErrorMessage: undefined
    })
);

export const getTranscriptsError = createAction<ITranscriptStatePatch, ITranscriptRequestError | undefined>(
    TranscriptActionEnums.getTranscriptsError,
    (error) => ({
        listStatus: "error",
        listErrorMessage: error?.message
    })
);

export const getTranscriptPending = createAction<ITranscriptStatePatch, { selectedTranscriptId: string }>(
    TranscriptActionEnums.getTranscriptPending,
    ({ selectedTranscriptId }) => ({
        selectedTranscriptId,
        detailStatus: "loading",
        detailErrorMessage: undefined
    })
);

export const getTranscriptSuccess = createAction<ITranscriptStatePatch, ITranscriptDetail>(
    TranscriptActionEnums.getTranscriptSuccess,
    (selectedTranscript) => ({
        selectedTranscriptId: selectedTranscript.id,
        selectedTranscript,
        detailStatus: "idle",
        detailErrorMessage: undefined
    })
);

export const getTranscriptError = createAction<ITranscriptStatePatch, ITranscriptRequestError | undefined>(
    TranscriptActionEnums.getTranscriptError,
    (error) => ({
        detailStatus: "error",
        detailErrorMessage: error?.message
    })
);

export const setTranscriptFilters = createAction<ITranscriptStatePatch, Partial<ITranscriptStateContext["filters"]>>(
    TranscriptActionEnums.setTranscriptFilters,
    (filters) => ({
        filters
    } as unknown as ITranscriptStatePatch)
);

export const clearSelectedTranscript = createAction<ITranscriptStatePatch>(
    TranscriptActionEnums.clearSelectedTranscript,
    () => ({
        selectedTranscriptId: undefined,
        selectedTranscript: undefined,
        detailStatus: "idle",
        detailErrorMessage: undefined
    })
);
