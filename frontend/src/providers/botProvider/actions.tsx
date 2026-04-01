"use client";

import { createAction } from "redux-actions";
import type { IBotDefinition, IBotRequestError, IBotStateContext, IBotSummary } from "./context";
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

    botAiKnowledgePending = "BOT_AI_KNOWLEDGE_PENDING",
    botAiKnowledgeSuccess = "BOT_AI_KNOWLEDGE_SUCCESS",
    botAiKnowledgeError = "BOT_AI_KNOWLEDGE_ERROR",
    clearBotAiKnowledgeError = "CLEAR_BOT_AI_KNOWLEDGE_ERROR",

    setSaveStatus = "SET_SAVE_STATUS",

    clearActiveBot = "CLEAR_ACTIVE_BOT"
}

export const getBotsPending = createAction<IBotStatePatch>(
    BotActionEnums.getBotsPending,
    () => ({
        isPending: true,
        isSuccess: false,
        isError: false,
        saveStatus: "idle",
        errorCode: undefined,
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
        errorCode: undefined,
        errorMessage: undefined
    })
);

export const getBotsError = createAction<IBotStatePatch, IBotRequestError | undefined>(
    BotActionEnums.getBotsError,
    (error) => ({
        isPending: false,
        isSuccess: false,
        isError: true,
        errorCode: error?.code,
        errorMessage: error?.message
    })
);

export const getBotPending = createAction<IBotStatePatch>(
    BotActionEnums.getBotPending,
    () => ({
        isPending: true,
        isSuccess: false,
        isError: false,
        errorCode: undefined,
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
        errorCode: undefined,
        errorMessage: undefined
    })
);

export const getBotError = createAction<IBotStatePatch, IBotRequestError | undefined>(
    BotActionEnums.getBotError,
    (error) => ({
        isPending: false,
        isSuccess: false,
        isError: true,
        errorCode: error?.code,
        errorMessage: error?.message
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
        errorCode: undefined,
        errorMessage: undefined
    })
);

export const createBotDraftPending = createAction<IBotStatePatch>(
    BotActionEnums.createBotDraftPending,
    () => ({
        saveStatus: "saving",
        isError: false,
        errorCode: undefined,
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
        errorCode: undefined,
        errorMessage: undefined
    })
);

export const createBotDraftError = createAction<IBotStatePatch, IBotRequestError | undefined>(
    BotActionEnums.createBotDraftError,
    (error) => ({
        isPending: false,
        isSuccess: false,
        isError: true,
        saveStatus:
            error?.code === "forbidden"
                ? "permission_denied"
                : error?.code === "method_not_allowed"
                    ? "api_mismatch"
                    : "error",
        errorCode: error?.code,
        errorMessage: error?.message
    })
);

export const updateBotDraftPending = createAction<IBotStatePatch>(
    BotActionEnums.updateBotDraftPending,
    () => ({
        saveStatus: "saving",
        isError: false,
        errorCode: undefined,
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
        errorCode: undefined,
        errorMessage: undefined
    })
);

export const updateBotDraftError = createAction<IBotStatePatch, IBotRequestError | undefined>(
    BotActionEnums.updateBotDraftError,
    (error) => ({
        isPending: false,
        isSuccess: false,
        isError: true,
        saveStatus:
            error?.code === "forbidden"
                ? "permission_denied"
                : error?.code === "method_not_allowed"
                    ? "api_mismatch"
                    : "error",
        errorCode: error?.code,
        errorMessage: error?.message
    })
);

export const validateBotDraftPending = createAction<IBotStatePatch>(
    BotActionEnums.validateBotDraftPending,
    () => ({
        isPending: true,
        isSuccess: false,
        isError: false,
        errorCode: undefined,
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
        errorCode: undefined,
        errorMessage: undefined
    })
);

export const validateBotDraftError = createAction<IBotStatePatch, IBotRequestError | undefined>(
    BotActionEnums.validateBotDraftError,
    (error) => ({
        isPending: false,
        isSuccess: false,
        isError: true,
        errorCode: error?.code,
        errorMessage: error?.message
    })
);

export const botAiKnowledgePending = createAction<IBotStatePatch, { status: IBotStateContext["aiKnowledgeStatus"] }>(
    BotActionEnums.botAiKnowledgePending,
    ({ status }) => ({
        aiKnowledgeStatus: status,
        aiKnowledgeErrorMessage: undefined
    })
);

export const botAiKnowledgeSuccess = createAction<IBotStatePatch, {
    activeBot?: IBotDefinition;
}>(
    BotActionEnums.botAiKnowledgeSuccess,
    ({ activeBot }) => ({
        aiKnowledgeStatus: "idle",
        aiKnowledgeErrorMessage: undefined,
        activeBot
    })
);

export const botAiKnowledgeError = createAction<IBotStatePatch, IBotRequestError | undefined>(
    BotActionEnums.botAiKnowledgeError,
    (error) => ({
        aiKnowledgeStatus: "error",
        aiKnowledgeErrorMessage: error?.message
    })
);

export const clearBotAiKnowledgeError = createAction<IBotStatePatch>(
    BotActionEnums.clearBotAiKnowledgeError,
    () => ({
        aiKnowledgeStatus: "idle",
        aiKnowledgeErrorMessage: undefined
    })
);

export const setSaveStatus = createAction<IBotStatePatch, { status: IBotStateContext["saveStatus"]; errorMessage?: string }>(
    BotActionEnums.setSaveStatus,
    ({ status, errorMessage }) => ({
        saveStatus: status,
        isError: status === "error" || status === "validation_blocked" || status === "permission_denied" || status === "api_mismatch",
        errorMessage,
        errorCode: undefined
    })
);

export const clearActiveBot = createAction<IBotStatePatch>(
    BotActionEnums.clearActiveBot,
    () => ({
        activeBot: undefined,
        draftIdentity: "temporary",
        saveStatus: "idle",
        aiKnowledgeStatus: "idle",
        aiKnowledgeErrorMessage: undefined,
        validationResults: undefined,
        errorCode: undefined,
        errorMessage: undefined
    })
);
