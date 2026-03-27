"use client";

import { useContext, useEffect, useReducer } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
    bootstrapAuthError,
    bootstrapAuthPending,
    bootstrapAuthSuccess,
    fetchCurrentUserError,
    fetchCurrentUserPending,
    fetchCurrentUserSuccess,
    signInError,
    signInPending,
    signInSuccess,
    signOutSuccess,
    signUpError,
    signUpPending,
    signUpSuccess
} from "./actions";
import {
    AuthActionContext,
    AuthStateContext,
    INITIAL_STATE,
    type IAuthTokenPayload,
    type ICurrentLoginInformations,
    type ISignInInput,
    type ISignUpInput
} from "./context";
import { AuthReducer } from "./reducer";
import { getAxiosInstance } from "@/utils/axiosInstance";
import { getAuthCookie, removeAuthCookie, setAuthCookie } from "@/utils/cookie";
import {
    removeTenantContext,
    setTenantContext,
    type ITenantContext
} from "@/utils/tenant-context";

interface AuthProviderProps {
    children: ReactNode;
}

interface IAbpAjaxResponse<T> {
    result?: T;
    success: boolean;
    targetUrl?: string;
    error?: {
        message?: string;
        details?: string;
    };
}

interface IRegisterOutput {
    canLogin: boolean;
}

interface IIsTenantAvailableOutput {
    state: number;
    tenantId?: number;
}

const TENANT_STATE_AVAILABLE = 1;
const TENANT_STATE_INACTIVE = 2;
const TENANT_STATE_NOT_FOUND = 3;

const DEFAULT_TENANCY_NAME = process.env.NEXT_PUBLIC_DEFAULT_TENANCY_NAME;
const ACCOUNT_REGISTER_URL = "/api/services/app/Account/Register";
const ACCOUNT_IS_TENANT_AVAILABLE_URL = "/api/services/app/Account/IsTenantAvailable";
const SESSION_LOGIN_INFO_URL = "/api/services/app/Session/GetCurrentLoginInformations";
const TOKEN_AUTH_URL = "/api/TokenAuth/Authenticate";
const DEVELOPER_DASHBOARD_ROUTE = "/developer/dashboard";

/**
 * Provides auth state and actions for sign-in, sign-up, and session bootstrap.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);
    const router = useRouter();

    const fetchCurrentUser = async (auth?: IAuthTokenPayload): Promise<ICurrentLoginInformations> => {
        dispatch(fetchCurrentUserPending());

        try {
            const instance = getAxiosInstance();
            const response = await instance.get<IAbpAjaxResponse<ICurrentLoginInformations>>(
                SESSION_LOGIN_INFO_URL
            );

            const currentLoginInformations = unwrapResponse(
                response.data,
                "We could not load your session."
            );

            if (currentLoginInformations.tenant) {
                setTenantContext({
                    tenantId: currentLoginInformations.tenant.id,
                    tenancyName: currentLoginInformations.tenant.tenancyName
                });
            } else {
                removeTenantContext();
            }

            dispatch(
                fetchCurrentUserSuccess({
                    currentLoginInformations,
                    auth
                })
            );

            return currentLoginInformations;
        } catch (error) {
            dispatch(fetchCurrentUserError());
            throw toError(error, "We could not load your session.");
        }
    };

    const signIn = async (input: ISignInInput): Promise<void> => {
        dispatch(signInPending());

        try {
            const tenantContext = await resolveTenantContext();
            setTenantContext(tenantContext);

            const instance = getAxiosInstance();
            const response = await instance.post<IAbpAjaxResponse<IAuthTokenPayload>>(
                TOKEN_AUTH_URL,
                {
                    userNameOrEmailAddress: input.userNameOrEmailAddress,
                    password: input.password,
                    rememberClient: input.rememberClient
                },
                {
                    headers: {
                        "Abp-TenantId": tenantContext.tenantId.toString()
                    }
                }
            );

            const auth = unwrapResponse(
                response.data,
                "We could not sign you in."
            );
            setAuthCookie(auth.accessToken, auth.expireInSeconds, input.rememberClient);
            const currentLoginInformations = await fetchCurrentUser(auth);

            dispatch(
                signInSuccess({
                    auth,
                    currentLoginInformations
                })
            );

            router.push(DEVELOPER_DASHBOARD_ROUTE);
        } catch (error) {
            removeAuthCookie();
            dispatch(signInError());
            throw toError(error, "We could not sign you in.");
        }
    };

    const signUp = async (input: ISignUpInput): Promise<void> => {
        dispatch(signUpPending());

        try {
            const tenantContext = await resolveTenantContext();
            setTenantContext(tenantContext);

            const instance = getAxiosInstance();
            const response = await instance.post<IAbpAjaxResponse<IRegisterOutput>>(
                ACCOUNT_REGISTER_URL,
                {
                    name: input.name,
                    surname: input.surname,
                    userName: input.userName,
                    emailAddress: input.emailAddress,
                    password: input.password,
                    captchaResponse: undefined
                },
                {
                    headers: {
                        "Abp-TenantId": tenantContext.tenantId.toString()
                    }
                }
            );

            const registerResult = unwrapResponse(
                response.data,
                "We could not create your account."
            );
            dispatch(signUpSuccess());

            if (registerResult.canLogin) {
                await signIn({
                    userNameOrEmailAddress: input.emailAddress,
                    password: input.password,
                    rememberClient: true
                });
            }
        } catch (error) {
            dispatch(signUpError());
            throw toError(error, "We could not create your account.");
        }
    };

    const bootstrapAuth = async (): Promise<void> => {
        const token = getAuthCookie();

        if (!token) {
            removeTenantContext();
            dispatch(bootstrapAuthSuccess());
            return;
        }

        dispatch(bootstrapAuthPending());

        try {
            await fetchCurrentUser();
            dispatch(bootstrapAuthSuccess());
        } catch (error) {
            removeAuthCookie();
            removeTenantContext();
            dispatch(bootstrapAuthError());
        }
    };

    const signOut = (): void => {
        removeAuthCookie();
        removeTenantContext();
        dispatch(signOutSuccess());
        router.push("/login");
    };

    useEffect(() => {
        void bootstrapAuth();
        // bootstrap on first mount only
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AuthStateContext.Provider value={state}>
            <AuthActionContext.Provider
                value={{
                    signIn,
                    signUp,
                    fetchCurrentUser: async () => {
                        await fetchCurrentUser(state.auth);
                    },
                    bootstrapAuth,
                    signOut
                }}
            >
                {children}
            </AuthActionContext.Provider>
        </AuthStateContext.Provider>
    );
};

/**
 * Reads the auth provider state.
 */
export const useAuthState = () => {
    const context = useContext(AuthStateContext);

    if (!context) {
        throw new Error("useAuthState must be used within an AuthProvider");
    }

    return context;
};

/**
 * Reads the auth provider actions.
 */
export const useAuthActions = () => {
    const context = useContext(AuthActionContext);

    if (!context) {
        throw new Error("useAuthActions must be used within an AuthProvider");
    }

    return context;
};

function toError(error: unknown, fallbackMessage: string): Error {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response
    ) {
        const data = error.response.data as IAbpAjaxResponse<unknown>;
        const message = data?.error?.message ?? fallbackMessage;
        return new Error(message);
    }

    if (error instanceof Error) {
        return error;
    }

    return new Error(fallbackMessage);
}

function getConfiguredTenancyName(): string {
    const configuredTenancyName = DEFAULT_TENANCY_NAME?.trim();

    if (!configuredTenancyName) {
        throw new Error("Workspace configuration is invalid. Please contact support.");
    }

    return configuredTenancyName;
}

async function resolveTenantContext(): Promise<ITenantContext> {
    const normalizedTenancyName = getConfiguredTenancyName();

    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IIsTenantAvailableOutput>>(
        ACCOUNT_IS_TENANT_AVAILABLE_URL,
        {
            tenancyName: normalizedTenancyName
        }
    );

    const result = unwrapResponse(
        response.data,
        "We could not resolve your workspace."
    );

    if (result.state === TENANT_STATE_NOT_FOUND) {
        throw new Error("Workspace configuration is invalid. Please contact support.");
    }

    if (result.state === TENANT_STATE_INACTIVE) {
        throw new Error("Workspace configuration is invalid. Please contact support.");
    }

    if (result.state !== TENANT_STATE_AVAILABLE || !result.tenantId) {
        throw new Error("Workspace configuration is invalid. Please contact support.");
    }

    return {
        tenantId: result.tenantId,
        tenancyName: normalizedTenancyName
    };
}

function unwrapResponse<T>(payload: IAbpAjaxResponse<T> | T, fallbackMessage: string): T {
    if (isAbpAjaxResponse<T>(payload)) {
        if (payload.result !== undefined) {
            return payload.result;
        }

        throw new Error(payload.error?.message ?? fallbackMessage);
    }

    return payload;
}

function isAbpAjaxResponse<T>(payload: IAbpAjaxResponse<T> | T): payload is IAbpAjaxResponse<T> {
    return typeof payload === "object" && payload !== null && "__abp" in payload;
}
