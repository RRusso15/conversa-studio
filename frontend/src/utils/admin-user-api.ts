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

export type IPromotableUser = IAdminUser;

const USER_GET_ALL_URL = "/api/services/app/User/GetAll";
const USER_UPDATE_URL = "/api/services/app/User/Update";
const REQUEST_CONFIG = {
    skipUnauthorizedRedirect: true,
    skipForbiddenRedirect: true
} as IAxiosRedirectControlConfig;

export async function getAdminUsers(): Promise<IAdminUser[]> {
    const users = await getAllUsers();

    return users.filter((user) => hasRoleName(user.roleNames, "admin"));
}

export async function getPromotableUsers(): Promise<IPromotableUser[]> {
    const users = await getAllUsers();

    return users.filter((user) => !hasRoleName(user.roleNames, "admin"));
}

export async function promoteUserToAdmin(user: IPromotableUser): Promise<IAdminUser> {
    const instance = getAxiosInstance();
    const response = await instance.put<IAbpAjaxResponse<IApiUser>>(
        USER_UPDATE_URL,
        {
            id: user.id,
            userName: user.userName,
            name: user.name,
            surname: user.surname,
            emailAddress: user.emailAddress,
            isActive: user.isActive,
            roleNames: Array.from(new Set([...user.roleNames, "Admin"]))
        },
        REQUEST_CONFIG
    );

    return mapUser(unwrapResponse(response.data, "We could not promote that user to admin."));
}

async function getAllUsers(): Promise<IAdminUser[]> {
    const instance = getAxiosInstance();
    const response = await instance.get<IAbpAjaxResponse<IPagedResultDto<IApiUser>>>(
        `${USER_GET_ALL_URL}?SkipCount=0&MaxResultCount=200`,
        REQUEST_CONFIG
    );
    const payload = unwrapResponse(response.data, "We could not load users.");

    return payload.items.map(mapUser);
}

function mapUser(user: IApiUser): IAdminUser {
    return {
        ...user,
        roleNames: user.roleNames ?? []
    };
}

function hasRoleName(roleNames: string[], roleName: string): boolean {
    return roleNames.some((currentRoleName) => currentRoleName.toLowerCase() === roleName.toLowerCase());
}

function unwrapResponse<T>(payload: IAbpAjaxResponse<T> | T, fallbackMessage: string): T {
    if (typeof payload === "object" && payload !== null && "success" in payload) {
        const response = payload as IAbpAjaxResponse<T>;
        if (response.result !== undefined) {
            return response.result;
        }

        throw new Error(response.error?.message ?? fallbackMessage);
    }

    return payload as T;
}
