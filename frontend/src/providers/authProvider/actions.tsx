"use client";

import { createAction } from "redux-actions";
import type {
    IAuthStateContext,
    IAuthTokenPayload,
    ICurrentLoginInformations
} from "./context";

export enum AuthActionEnums {
    signInPending = "SIGN_IN_PENDING",
    signInSuccess = "SIGN_IN_SUCCESS",
    signInError = "SIGN_IN_ERROR",

    signUpPending = "SIGN_UP_PENDING",
    signUpSuccess = "SIGN_UP_SUCCESS",
    signUpError = "SIGN_UP_ERROR",

    fetchCurrentUserPending = "FETCH_CURRENT_USER_PENDING",
    fetchCurrentUserSuccess = "FETCH_CURRENT_USER_SUCCESS",
    fetchCurrentUserError = "FETCH_CURRENT_USER_ERROR",

    bootstrapAuthPending = "BOOTSTRAP_AUTH_PENDING",
    bootstrapAuthSuccess = "BOOTSTRAP_AUTH_SUCCESS",
    bootstrapAuthError = "BOOTSTRAP_AUTH_ERROR",

    signOut = "SIGN_OUT"
}

export const signInPending = createAction<IAuthStateContext>(
    AuthActionEnums.signInPending,
    () => ({
        isPending: true,
        isSuccess: false,
        isError: false,
        isAuthenticated: false,
        isBootstrapped: false
    })
);

export const signInSuccess = createAction<
    IAuthStateContext,
    { auth: IAuthTokenPayload; currentLoginInformations?: ICurrentLoginInformations }
>(
    AuthActionEnums.signInSuccess,
    ({
        auth,
        currentLoginInformations
    }: {
        auth: IAuthTokenPayload;
        currentLoginInformations?: ICurrentLoginInformations;
    }) => ({
        isPending: false,
        isSuccess: true,
        isError: false,
        isAuthenticated: true,
        isBootstrapped: true,
        auth,
        currentLoginInformations
    })
);

export const signInError = createAction<IAuthStateContext>(
    AuthActionEnums.signInError,
    () => ({
        isPending: false,
        isSuccess: false,
        isError: true,
        isAuthenticated: false,
        isBootstrapped: true
    })
);

export const signUpPending = createAction<IAuthStateContext>(
    AuthActionEnums.signUpPending,
    () => ({
        isPending: true,
        isSuccess: false,
        isError: false,
        isAuthenticated: false,
        isBootstrapped: false
    })
);

export const signUpSuccess = createAction<IAuthStateContext>(
    AuthActionEnums.signUpSuccess,
    () => ({
        isPending: false,
        isSuccess: true,
        isError: false,
        isAuthenticated: false,
        isBootstrapped: true
    })
);

export const signUpError = createAction<IAuthStateContext>(
    AuthActionEnums.signUpError,
    () => ({
        isPending: false,
        isSuccess: false,
        isError: true,
        isAuthenticated: false,
        isBootstrapped: true
    })
);

export const fetchCurrentUserPending = createAction<IAuthStateContext>(
    AuthActionEnums.fetchCurrentUserPending,
    () => ({
        isPending: true,
        isSuccess: false,
        isError: false,
        isAuthenticated: false,
        isBootstrapped: false
    })
);

export const fetchCurrentUserSuccess = createAction<
    IAuthStateContext,
    { currentLoginInformations: ICurrentLoginInformations; auth?: IAuthTokenPayload }
>(
    AuthActionEnums.fetchCurrentUserSuccess,
    ({
        currentLoginInformations,
        auth
    }: {
        currentLoginInformations: ICurrentLoginInformations;
        auth?: IAuthTokenPayload;
    }) => ({
        isPending: false,
        isSuccess: true,
        isError: false,
        isAuthenticated: Boolean(currentLoginInformations.user),
        isBootstrapped: true,
        currentLoginInformations,
        auth
    })
);

export const fetchCurrentUserError = createAction<IAuthStateContext>(
    AuthActionEnums.fetchCurrentUserError,
    () => ({
        isPending: false,
        isSuccess: false,
        isError: true,
        isAuthenticated: false,
        isBootstrapped: true,
        auth: undefined,
        currentLoginInformations: undefined
    })
);

export const bootstrapAuthPending = createAction<IAuthStateContext>(
    AuthActionEnums.bootstrapAuthPending,
    () => ({
        isPending: true,
        isSuccess: false,
        isError: false,
        isAuthenticated: false,
        isBootstrapped: false
    })
);

export const bootstrapAuthSuccess = createAction<IAuthStateContext>(
    AuthActionEnums.bootstrapAuthSuccess,
    () => ({
        isPending: false,
        isSuccess: true,
        isError: false,
        isAuthenticated: false,
        isBootstrapped: true
    })
);

export const bootstrapAuthError = createAction<IAuthStateContext>(
    AuthActionEnums.bootstrapAuthError,
    () => ({
        isPending: false,
        isSuccess: false,
        isError: true,
        isAuthenticated: false,
        isBootstrapped: true
    })
);

export const signOutSuccess = createAction<IAuthStateContext>(
    AuthActionEnums.signOut,
    () => ({
        ...{
            isPending: false,
            isSuccess: false,
            isError: false,
            isAuthenticated: false,
            isBootstrapped: true,
            auth: undefined,
            currentLoginInformations: undefined
        }
    })
);
