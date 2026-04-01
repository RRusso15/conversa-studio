"use client";

import { handleActions } from "redux-actions";
import { INITIAL_STATE, type ITranscriptStateContext } from "./context";
import { TranscriptActionEnums } from "./actions";

interface IReducerAction {
    payload?: Partial<ITranscriptStateContext>;
}

export const TranscriptReducer = handleActions<ITranscriptStateContext, ITranscriptStateContext>(
    {
        [TranscriptActionEnums.getTranscriptsPending]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [TranscriptActionEnums.getTranscriptsSuccess]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [TranscriptActionEnums.getTranscriptsError]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [TranscriptActionEnums.getTranscriptPending]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [TranscriptActionEnums.getTranscriptSuccess]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [TranscriptActionEnums.getTranscriptError]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [TranscriptActionEnums.setTranscriptFilters]: (state, action: IReducerAction) => ({
            ...state,
            filters: {
                ...state.filters,
                ...action.payload?.filters
            }
        }),
        [TranscriptActionEnums.clearSelectedTranscript]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        })
    },
    INITIAL_STATE
);
