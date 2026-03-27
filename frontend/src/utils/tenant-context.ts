"use strict";

export interface ITenantContext {
    tenantId: number;
    tenancyName: string;
}

const TENANT_ID_STORAGE_KEY = "conversa_studio_tenant_id";
const TENANCY_NAME_STORAGE_KEY = "conversa_studio_tenancy_name";

/**
 * Reads the tenant context persisted in browser storage.
 */
export function getTenantContext(): ITenantContext | undefined {
    if (typeof window === "undefined") {
        return undefined;
    }

    const tenantIdValue = window.localStorage.getItem(TENANT_ID_STORAGE_KEY);
    const tenancyName = window.localStorage.getItem(TENANCY_NAME_STORAGE_KEY);

    if (!tenantIdValue || !tenancyName) {
        return undefined;
    }

    const tenantId = Number.parseInt(tenantIdValue, 10);

    if (Number.isNaN(tenantId)) {
        return undefined;
    }

    return {
        tenantId,
        tenancyName
    };
}

/**
 * Persists the current tenant context for authenticated API calls.
 */
export function setTenantContext(context: ITenantContext): void {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(TENANT_ID_STORAGE_KEY, context.tenantId.toString());
    window.localStorage.setItem(TENANCY_NAME_STORAGE_KEY, context.tenancyName);
}

/**
 * Clears the stored tenant context.
 */
export function removeTenantContext(): void {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.removeItem(TENANT_ID_STORAGE_KEY);
    window.localStorage.removeItem(TENANCY_NAME_STORAGE_KEY);
}
