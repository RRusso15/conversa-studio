const WIDGET_ERROR_FALLBACK = "The widget request could not be completed.";

/**
 * Resolves the backend API base URL for server-side widget proxy handlers.
 */
export function getWidgetApiBaseUrl(): string {
    const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

    if (!configuredUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured for widget runtime proxying.");
    }

    return configuredUrl.replace(/\/$/, "");
}

/**
 * Builds a backend widget runtime URL from a relative runtime path.
 * @param path Relative widget runtime path beginning with "/".
 */
export function buildWidgetBackendUrl(path: string): string {
    return `${getWidgetApiBaseUrl()}${path}`;
}

/**
 * Creates a passthrough JSON response from a backend widget runtime response.
 * @param response Backend response to relay.
 */
export async function createWidgetProxyResponse(response: Response): Promise<Response> {
    const responseText = await response.text();
    const contentType = response.headers.get("Content-Type") ?? "application/json; charset=utf-8";

    return new Response(responseText, {
        status: response.status,
        headers: {
            "Content-Type": contentType,
            "Cache-Control": "no-store"
        }
    });
}

/**
 * Creates a consistent proxy error response when the frontend cannot reach the backend.
 * @param error Error raised while proxying the widget request.
 */
export function createWidgetProxyFailureResponse(error: unknown): Response {
    const message = error instanceof Error && error.message.trim()
        ? error.message
        : WIDGET_ERROR_FALLBACK;

    return Response.json(
        { error: message },
        {
            status: 502,
            headers: {
                "Cache-Control": "no-store"
            }
        }
    );
}
