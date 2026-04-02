"use strict";

import { getAxiosInstance, type IAxiosRedirectControlConfig } from "./axiosInstance";

export interface IChangePasswordInput {
    currentPassword: string;
    newPassword: string;
}

interface IAbpAjaxResponse<T> {
    result?: T;
    success: boolean;
    targetUrl?: string;
    error?: {
        message?: string;
        details?: string;
        validationErrors?: Array<{
            message?: string;
            members?: string[];
        }>;
    };
}

const ACCOUNT_CHANGE_PASSWORD_URL = "/api/services/app/Account/ChangePassword";
const SETTINGS_REQUEST_CONFIG = {
    skipUnauthorizedRedirect: true,
    skipForbiddenRedirect: true
} as IAxiosRedirectControlConfig;

/**
 * Changes the current authenticated user's password.
 */
export async function changePassword(input: IChangePasswordInput): Promise<boolean> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<boolean>>(
        ACCOUNT_CHANGE_PASSWORD_URL,
        {
            currentPassword: input.currentPassword,
            newPassword: input.newPassword
        },
        SETTINGS_REQUEST_CONFIG
    );

    return unwrapResponse(response.data, "We could not change your password.");
}

function unwrapResponse<T>(payload: IAbpAjaxResponse<T> | T, fallbackMessage: string): T {
    if (isAbpAjaxResponse<T>(payload)) {
        if (payload.result !== undefined) {
            return payload.result;
        }

        const validationMessage = payload.error?.validationErrors
            ?.map((validationError) => validationError.message)
            .filter((message): message is string => Boolean(message))
            .join(" ");

        throw new Error(validationMessage || payload.error?.details || payload.error?.message || fallbackMessage);
    }

    return payload;
}

function isAbpAjaxResponse<T>(payload: IAbpAjaxResponse<T> | T): payload is IAbpAjaxResponse<T> {
    return typeof payload === "object" && payload !== null && "__abp" in payload;
}
