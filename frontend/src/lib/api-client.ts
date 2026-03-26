"use strict";

import axios from "axios";

const DEFAULT_API_BASE_URL = "http://russell.servecounterstrike.com";

/**
 * Shared Axios client for browser and server requests to the deployed backend.
 */
export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
    headers: {
        "Content-Type": "application/json"
    },
    timeout: 15000
});

/**
 * Sets or clears the bearer token used for authenticated API requests.
 * @param token JWT bearer token or undefined to remove the header.
 */
export function setApiClientToken(token?: string): void {
    if (token) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
        return;
    }

    delete apiClient.defaults.headers.common.Authorization;
}
