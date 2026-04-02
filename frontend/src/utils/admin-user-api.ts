"use client";

import { getAxiosInstance, type IAxiosRedirectControlConfig } from "./axiosInstance";

interface IAbpAjaxResponse<T> {
    result?: T;
    success: boolean;
    error?: {
        message?: string;
        details?: string;
    };
}

interface IPagedResultDto<T> {
    items: T[];
    totalCount: number;
}

interface IApiUser {
    id: number;
    userName: string;
    name: string;
    surname: string;
    emailAddress: string;
    isActive: boolean;
    roleNames?: string[];
    creationTime: string;
}

export interface IAdminUser {
    id: number;
    userName: string;
    name: string;
    surname: string;
    emailAddress: string;
    isActive: boolean;
    roleNames: string[];
    creationTime: string;
}

const USER_GET_ALL_URL = "/api/services/app/User/GetAll";
const USER_CREATE_URL = "/api/services/app/User/Create";
const REQUEST_CONFIG = {
    skipUnauthorizedRedirect: true,
    skipForbiddenRedirect: true
} as IAxiosRedirectControlConfig;

export async function getAdminUsers(): Promise<IAdminUser[]> {
    const instance = getAxiosInstance();
    const response = await instance.get<IAbpAjaxResponse<IPagedResultDto<IApiUser>>>(
        `${USER_GET_ALL_URL}?SkipCount=0&MaxResultCount=200`,
        REQUEST_CONFIG
    );
    const payload = unwrapResponse(response.data, "We could not load administrators.");

    return payload.items
        .map(mapUser)
        .filter((user) => user.roleNames.some((roleName) => roleName.toLowerCase() === "admin"));
}

export async function createAdminUser(input: {
    userName: string;
    name: string;
    surname: string;
    emailAddress: string;
    password: string;
}): Promise<IAdminUser> {
    const instance = getAxiosInstance();
    const response = await instance.post<IAbpAjaxResponse<IApiUser>>(
        USER_CREATE_URL,
        {
            ...input,
            isActive: true,
            roleNames: ["Admin"]
        },
        REQUEST_CONFIG
    );

    return mapUser(unwrapResponse(response.data, "We could not create that administrator."));
}

function mapUser(user: IApiUser): IAdminUser {
    return {
        ...user,
        roleNames: user.roleNames ?? []
    };
}

function unwrapResponse<T>(payload: IAbpAjaxResponse<T> | T, fallbackMessage: string): T {
    if (typeof payload === "object" && payload !== null && "__abp" in payload) {
        const response = payload as IAbpAjaxResponse<T>;
        if (response.result !== undefined) {
            return response.result;
        }

        throw new Error(response.error?.message ?? fallbackMessage);
    }

    return payload as T;
}
