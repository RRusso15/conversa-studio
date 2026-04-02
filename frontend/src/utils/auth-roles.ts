"use client";

import type { ICurrentLoginInformations, IUserLoginInfo } from "@/providers/authProvider/context";

export const ADMIN_ROLE_NAME = "Admin";
export const DEVELOPER_ROLE_NAME = "Developer";

export function getUserRoleNames(user?: IUserLoginInfo): string[] {
    return user?.roleNames?.filter((roleName): roleName is string => Boolean(roleName)) ?? [];
}

export function hasRole(user: IUserLoginInfo | undefined, roleName: string): boolean {
    return getUserRoleNames(user).some((candidate) => candidate.toLowerCase() === roleName.toLowerCase());
}

export function isAdminUser(user?: IUserLoginInfo): boolean {
    return hasRole(user, ADMIN_ROLE_NAME);
}

export function isDeveloperUser(user?: IUserLoginInfo): boolean {
    return hasRole(user, DEVELOPER_ROLE_NAME);
}

export function getDefaultAuthenticatedRoute(currentLoginInformations?: ICurrentLoginInformations): string {
    if (isAdminUser(currentLoginInformations?.user)) {
        return "/admin";
    }

    return "/developer/dashboard";
}
