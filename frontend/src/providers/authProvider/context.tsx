"use client";

import { createContext } from "react";

export interface IAuthTokenPayload {
    accessToken: string;
    encryptedAccessToken: string;
    expireInSeconds: number;
    userId: number;
}

export interface IApplicationInfo {
    version: string;
    releaseDate: string;
    features: Record<string, boolean>;
}

export interface ITenantLoginInfo {
    id: number;
    tenancyName: string;
    name: string;
}

export interface IUserLoginInfo {
    id: number;
    name: string;
    surname: string;
    userName: string;
    emailAddress: string;
}

export interface ICurrentLoginInformations {
    application?: IApplicationInfo;
    tenant?: ITenantLoginInfo;
    user?: IUserLoginInfo;
}

export interface ISignInInput {
    userNameOrEmailAddress: string;
    password: string;
    rememberClient: boolean;
    tenancyName: string;
}

export interface ISignUpInput {
    name: string;
    surname: string;
    userName: string;
    emailAddress: string;
    password: string;
    tenancyName: string;
}

export interface IAuthStateContext {
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    isAuthenticated: boolean;
    isBootstrapped: boolean;
    auth?: IAuthTokenPayload;
    currentLoginInformations?: ICurrentLoginInformations;
}

export interface IAuthActionContext {
    signIn: (input: ISignInInput) => Promise<void>;
    signUp: (input: ISignUpInput) => Promise<void>;
    fetchCurrentUser: () => Promise<void>;
    bootstrapAuth: () => Promise<void>;
    signOut: () => void;
}

export const INITIAL_STATE: IAuthStateContext = {
    isPending: false,
    isSuccess: false,
    isError: false,
    isAuthenticated: false,
    isBootstrapped: false
};

export const INITIAL_ACTION_STATE: IAuthActionContext = {
    signIn: async () => undefined,
    signUp: async () => undefined,
    fetchCurrentUser: async () => undefined,
    bootstrapAuth: async () => undefined,
    signOut: () => undefined
};

export const AuthStateContext =
    createContext<IAuthStateContext>(INITIAL_STATE);

export const AuthActionContext =
    createContext<IAuthActionContext | undefined>(undefined);
