import {
    buildWidgetBackendUrl,
    createWidgetProxyFailureResponse,
    createWidgetProxyResponse
} from "../../shared";

interface WidgetBootstrapRouteContext {
    params: Promise<{
        deploymentKey: string;
    }>;
}

/**
 * Proxies widget bootstrap requests through the frontend domain so the embed snippet does not expose the backend host.
 */
export async function GET(request: Request, context: WidgetBootstrapRouteContext): Promise<Response> {
    const { deploymentKey } = await context.params;
    const embedOrigin = request.headers.get("X-Conversa-Embed-Origin") ?? "";

    try {
        const response = await fetch(
            buildWidgetBackendUrl(`/api/widget/deployments/${encodeURIComponent(deploymentKey)}/bootstrap`),
            {
                headers: {
                    "X-Conversa-Embed-Origin": embedOrigin
                },
                cache: "no-store"
            }
        );

        return await createWidgetProxyResponse(response);
    } catch (error) {
        return createWidgetProxyFailureResponse(error);
    }
}
