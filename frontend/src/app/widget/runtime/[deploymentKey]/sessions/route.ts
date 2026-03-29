import {
    buildWidgetBackendUrl,
    createWidgetProxyFailureResponse,
    createWidgetProxyResponse
} from "../../shared";

interface WidgetSessionsRouteContext {
    params: Promise<{
        deploymentKey: string;
    }>;
}

/**
 * Proxies widget session creation and resume requests through the frontend domain.
 */
export async function POST(request: Request, context: WidgetSessionsRouteContext): Promise<Response> {
    const { deploymentKey } = await context.params;
    const embedOrigin = request.headers.get("X-Conversa-Embed-Origin") ?? "";

    try {
        const requestBody = await request.text();
        const response = await fetch(
            buildWidgetBackendUrl(`/api/widget/deployments/${encodeURIComponent(deploymentKey)}/sessions`),
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
