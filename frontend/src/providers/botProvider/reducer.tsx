"use client";

import { handleActions } from "redux-actions";
import { INITIAL_STATE, type IBotStateContext } from "./context";
import { BotActionEnums } from "./actions";

interface IReducerAction {
    payload?: IBotStateContext;
}

export const BotReducer = handleActions<IBotStateContext, IBotStateContext>(
    {
        [BotActionEnums.getBotsPending]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BotActionEnums.getBotsSuccess]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BotActionEnums.getBotsError]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BotActionEnums.getBotPending]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BotActionEnums.getBotSuccess]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BotActionEnums.getBotError]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BotActionEnums.initializeNewBotDraft]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BotActionEnums.createBotDraftPending]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BotActionEnums.createBotDraftSuccess]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload,
            bots: state.bots && action.payload?.activeBot
                ? upsertBotSummary(state.bots, action.payload.activeBot)
                : state.bots
        }),
        [BotActionEnums.createBotDraftError]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BotActionEnums.updateBotDraftPending]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BotActionEnums.updateBotDraftSuccess]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload,
            bots: state.bots && action.payload?.activeBot
                ? upsertBotSummary(state.bots, action.payload.activeBot)
                : state.bots
        }),
        [BotActionEnums.updateBotDraftError]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BotActionEnums.validateBotDraftPending]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BotActionEnums.validateBotDraftSuccess]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BotActionEnums.validateBotDraftError]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BotActionEnums.setSaveStatus]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [BotActionEnums.clearActiveBot]: (state, action: IReducerAction) => ({
            ...state,
            ...action.payload
        })
    },
    INITIAL_STATE
);

function upsertBotSummary(
    bots: NonNullable<IBotStateContext["bots"]>,
    activeBot: NonNullable<IBotStateContext["activeBot"]>
) {
    const summary = {
        id: activeBot.id,
        name: activeBot.name,
        status: activeBot.status,
        draftVersion: activeBot.draftVersion,
        publishedVersion: activeBot.publishedVersion,
        hasUnpublishedChanges: activeBot.hasUnpublishedChanges,
        updatedAt: activeBot.updatedAt
    };
    const existingIndex = bots.findIndex((bot) => bot.id === activeBot.id);

    if (existingIndex < 0) {
        return [summary, ...bots];
    }

    return bots.map((bot) => bot.id === activeBot.id ? summary : bot);
}
