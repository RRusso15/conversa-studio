import {
    buildWidgetBackendUrl,
    createWidgetProxyFailureResponse,
    createWidgetProxyResponse
} from "../../../../shared";

interface WidgetMessagesRouteContext {
    params: Promise<{
        deploymentKey: string;
        sessionId: string;
    }>;
}

/**
 * Proxies widget message send requests through the frontend domain.
 */
export async function POST(request: Request, context: WidgetMessagesRouteContext): Promise<Response> {
    const { deploymentKey, sessionId } = await context.params;
    const embedOrigin = request.headers.get("X-Conversa-Embed-Origin") ?? "";

    try {
        const requestBody = await request.text();
        const response = await fetch(
            buildWidgetBackendUrl(`/api/widget/deployments/${encodeURIComponent(deploymentKey)}/sessions/${encodeURIComponent(sessionId)}/messages`),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Conversa-Embed-Origin": embedOrigin
                },
                body: requestBody,
                cache: "no-store"
            }
        );

        return await createWidgetProxyResponse(response);
    } catch (error) {
        return createWidgetProxyFailureResponse(error);
    }
}
