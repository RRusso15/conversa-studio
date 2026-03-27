"use strict";

import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getAuthCookie, removeAuthCookie } from "./cookie";
import { getTenantContext, removeTenantContext } from "./tenant-context";

let axiosInstance: ReturnType<typeof axios.create> | null = null;

export interface IAxiosRedirectControlConfig extends InternalAxiosRequestConfig {
    skipUnauthorizedRedirect?: boolean;
    skipForbiddenRedirect?: boolean;
}

/**
 * Returns the shared Axios instance used for authenticated API calls.
 */
export const getAxiosInstance = () => {
    if (axiosInstance) {
        return axiosInstance;
    }

    const baseURL = process.env.NEXT_PUBLIC_API_URL;

    if (!baseURL) {
        throw new Error("NEXT_PUBLIC_API_URL is not defined");
    }

    axiosInstance = axios.create({
        baseURL,
        headers: {
            "Content-Type": "application/json"
        }
    });

    axiosInstance.interceptors.request.use((config) => {
        const token = getAuthCookie();
        const tenantContext = getTenantContext();

        if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (tenantContext) {
            config.headers = config.headers ?? {};
            config.headers["Abp-TenantId"] = tenantContext.tenantId.toString();
        }

        return config;
    });

    axiosInstance.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
            const status = error.response?.status;
            const requestConfig = error.config as IAxiosRedirectControlConfig | undefined;

            if (status === 401 && !requestConfig?.skipUnauthorizedRedirect) {
                removeAuthCookie();
                removeTenantContext();

                if (typeof window !== "undefined") {
                    const currentPath = window.location.pathname;

                    if (!currentPath.startsWith("/login")) {
                        window.location.href = "/login";
                    }
                }
            }

            if (status === 403 && !requestConfig?.skipForbiddenRedirect && typeof window !== "undefined") {
                const currentPath = window.location.pathname;

                if (!currentPath.startsWith("/unauthorized")) {
                    window.location.href = "/unauthorized";
                }
            }

            return Promise.reject(error);
        }
    );

    return axiosInstance;
};
