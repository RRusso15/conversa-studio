"use strict";

const AUTH_COOKIE_NAME = "conversa_studio_auth_token";

/**
 * Gets the auth token from the browser cookie store.
 */
export function getAuthCookie(): string | undefined {
    if (typeof document === "undefined") {
        return undefined;
    }

    const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
    const tokenCookie = cookies.find((cookie) =>
        cookie.startsWith(`${AUTH_COOKIE_NAME}=`)
    );

    if (!tokenCookie) {
        return undefined;
    }

    return decodeURIComponent(tokenCookie.substring(AUTH_COOKIE_NAME.length + 1));
}

/**
 * Persists the auth token in a browser cookie.
 * @param token Bearer token value.
 * @param expiresInSeconds Optional expiration in seconds.
 * @param persist Whether to create a persistent cookie.
 */
export function setAuthCookie(
    token: string,
    expiresInSeconds?: number,
    persist = true
): void {
    if (typeof document === "undefined") {
        return;
    }

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const sameSite = "; SameSite=Lax";
    const path = "; Path=/";
    const expires = persist && expiresInSeconds
        ? `; Expires=${new Date(Date.now() + expiresInSeconds * 1000).toUTCString()}`
        : "";

    document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}${expires}${path}${sameSite}${secure}`;
}

/**
 * Removes the auth token cookie.
 */
export function removeAuthCookie(): void {
    if (typeof document === "undefined") {
        return;
    }

    document.cookie = `${AUTH_COOKIE_NAME}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax`;
}
