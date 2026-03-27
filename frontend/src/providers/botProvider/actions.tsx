"use client";

import { createAction } from "redux-actions";
import type { IBotDefinition, IBotStateContext, IBotSummary } from "./context";
import type { ValidationResult } from "@/components/developer/builder/types";

type IBotStatePatch = Partial<IBotStateContext>;

export enum BotActionEnums {
    getBotsPending = "GET_BOTS_PENDING",
    getBotsSuccess = "GET_BOTS_SUCCESS",
    getBotsError = "GET_BOTS_ERROR",

    getBotPending = "GET_BOT_PENDING",
    getBotSuccess = "GET_BOT_SUCCESS",
    getBotError = "GET_BOT_ERROR",

    initializeNewBotDraft = "INITIALIZE_NEW_BOT_DRAFT",

    createBotDraftPending = "CREATE_BOT_DRAFT_PENDING",
    createBotDraftSuccess = "CREATE_BOT_DRAFT_SUCCESS",
    createBotDraftError = "CREATE_BOT_DRAFT_ERROR",

    updateBotDraftPending = "UPDATE_BOT_DRAFT_PENDING",
    updateBotDraftSuccess = "UPDATE_BOT_DRAFT_SUCCESS",
    updateBotDraftError = "UPDATE_BOT_DRAFT_ERROR",

    validateBotDraftPending = "VALIDATE_BOT_DRAFT_PENDING",
    validateBotDraftSuccess = "VALIDATE_BOT_DRAFT_SUCCESS",
    validateBotDraftError = "VALIDATE_BOT_DRAFT_ERROR",

    clearActiveBot = "CLEAR_ACTIVE_BOT"
}

export const getBotsPending = createAction<IBotStatePatch>(
    BotActionEnums.getBotsPending,
    () => ({
        isPending: true,
        isSuccess: false,
        isError: false,
        saveStatus: "idle",
        errorMessage: undefined
    })
);

export const getBotsSuccess = createAction<IBotStatePatch, IBotSummary[]>(
    BotActionEnums.getBotsSuccess,
    (bots) => ({
        isPending: false,
        isSuccess: true,
        isError: false,
        bots,
        errorMessage: undefined
    })
);

export const getBotsError = createAction<IBotStatePatch, string | undefined>(
    BotActionEnums.getBotsError,
    (errorMessage) => ({
        isPending: false,
        isSuccess: false,
        isError: true,
        errorMessage
    })
);

export const getBotPending = createAction<IBotStatePatch>(
    BotActionEnums.getBotPending,
    () => ({
        isPending: true,
        isSuccess: false,
        isError: false,
        errorMessage: undefined
    })
);

export const getBotSuccess = createAction<IBotStatePatch, IBotDefinition>(
    BotActionEnums.getBotSuccess,
    (activeBot) => ({
        isPending: false,
        isSuccess: true,
        isError: false,
        activeBot,
        draftIdentity: "persisted",
        saveStatus: "idle",
        errorMessage: undefined
    })
);

export const getBotError = createAction<IBotStatePatch, string | undefined>(
    BotActionEnums.getBotError,
    (errorMessage) => ({
        isPending: false,
        isSuccess: false,
        isError: true,
        errorMessage
    })
);

export const initializeNewBotDraft = createAction<IBotStatePatch, IBotDefinition>(
    BotActionEnums.initializeNewBotDraft,
    (activeBot) => ({
        isPending: false,
        isSuccess: true,
        isError: false,
        activeBot,
        draftIdentity: "temporary",
        saveStatus: "idle",
        errorMessage: undefined
    })
);

export const createBotDraftPending = createAction<IBotStatePatch>(
    BotActionEnums.createBotDraftPending,
    () => ({
        saveStatus: "saving",
        isError: false,
        errorMessage: undefined
    })
);

export const createBotDraftSuccess = createAction<IBotStatePatch, IBotDefinition>(
    BotActionEnums.createBotDraftSuccess,
    (activeBot) => ({
        isPending: false,
        isSuccess: true,
        isError: false,
        activeBot,
        draftIdentity: "persisted",
        saveStatus: "saved",
        errorMessage: undefined
    })
);

export const createBotDraftError = createAction<IBotStatePatch, string | undefined>(
    BotActionEnums.createBotDraftError,
    (errorMessage) => ({
        isPending: false,
        isSuccess: false,
        isError: true,
        saveStatus: "error",
        errorMessage
    })
);

export const updateBotDraftPending = createAction<IBotStatePatch>(
    BotActionEnums.updateBotDraftPending,
    () => ({
        saveStatus: "saving",
        isError: false,
        errorMessage: undefined
    })
);

export const updateBotDraftSuccess = createAction<IBotStatePatch, IBotDefinition>(
    BotActionEnums.updateBotDraftSuccess,
    (activeBot) => ({
        isPending: false,
        isSuccess: true,
        isError: false,
        activeBot,
        draftIdentity: "persisted",
        saveStatus: "saved",
        errorMessage: undefined
    })
);

export const updateBotDraftError = createAction<IBotStatePatch, string | undefined>(
    BotActionEnums.updateBotDraftError,
    (errorMessage) => ({
        isPending: false,
        isSuccess: false,
        isError: true,
        saveStatus: "error",
        errorMessage
    })
);

export const validateBotDraftPending = createAction<IBotStatePatch>(
    BotActionEnums.validateBotDraftPending,
    () => ({
        isPending: true,
        isSuccess: false,
        isError: false,
        errorMessage: undefined
    })
);

export const validateBotDraftSuccess = createAction<IBotStatePatch, ValidationResult[]>(
    BotActionEnums.validateBotDraftSuccess,
    (validationResults) => ({
        isPending: false,
        isSuccess: true,
        isError: false,
        validationResults,
        errorMessage: undefined
    })
);

export const validateBotDraftError = createAction<IBotStatePatch, string | undefined>(
    BotActionEnums.validateBotDraftError,
    (errorMessage) => ({
        isPending: false,
        isSuccess: false,
        isError: true,
        errorMessage
    })
);

export const clearActiveBot = createAction<IBotStatePatch>(
    BotActionEnums.clearActiveBot,
    () => ({
        activeBot: undefined,
        draftIdentity: "temporary",
        saveStatus: "idle",
        validationResults: undefined,
        errorMessage: undefined
    })
);
