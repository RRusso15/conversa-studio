"use client";

import { handleActions } from "redux-actions";
import { INITIAL_STATE, type IAuthStateContext } from "./context";
import { AuthActionEnums } from "./actions";

interface IReducerAction {
    payload?: IAuthStateContext;
}

export const AuthReducer = handleActions<IAuthStateContext, IAuthStateContext>(
    {
        [AuthActionEnums.signInPending]: (state: IAuthStateContext, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [AuthActionEnums.signInSuccess]: (state: IAuthStateContext, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [AuthActionEnums.signInError]: (state: IAuthStateContext, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [AuthActionEnums.signUpPending]: (state: IAuthStateContext, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [AuthActionEnums.signUpSuccess]: (state: IAuthStateContext, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [AuthActionEnums.signUpError]: (state: IAuthStateContext, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [AuthActionEnums.fetchCurrentUserPending]: (state: IAuthStateContext, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [AuthActionEnums.fetchCurrentUserSuccess]: (state: IAuthStateContext, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [AuthActionEnums.fetchCurrentUserError]: (state: IAuthStateContext, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [AuthActionEnums.bootstrapAuthPending]: (state: IAuthStateContext, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [AuthActionEnums.bootstrapAuthSuccess]: (state: IAuthStateContext, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [AuthActionEnums.bootstrapAuthError]: (state: IAuthStateContext, action: IReducerAction) => ({
            ...state,
            ...action.payload
        }),
        [AuthActionEnums.signOut]: (state: IAuthStateContext, action: IReducerAction) => ({
            ...state,
            ...action.payload
        })
    },
    INITIAL_STATE
);
