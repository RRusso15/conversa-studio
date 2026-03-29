"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { Button, Input, Spin, Typography } from "antd";

const { Text, Title } = Typography;

interface WidgetEmbedClientProps {
    deploymentKey: string;
    parentOrigin: string;
}

interface IWidgetBootstrap {
    deploymentId: string;
    deploymentKey: string;
    botName: string;
    launcherLabel: string;
    themeColor: string;
    isActive: boolean;
}

interface IWidgetMessage {
    role: "bot" | "user";
    content: string;
    createdAt: string;
}

interface IWidgetSessionResponse {
    sessionId: string;
    botName: string;
    messages: IWidgetMessage[];
    awaitingInput: boolean;
    awaitingInputMode: "question" | "choice" | "";
    suggestedReplies: string[];
    isCompleted: boolean;
}

interface IWidgetErrorResponse {
    error?: string;
}

interface IAbpWidgetResponse<T> {
    result?: T;
    success?: boolean;
    error?: {
        message?: string;
        details?: string;
    };
}

const SESSION_STORAGE_PREFIX = "conversa-widget-session";

export function WidgetEmbedClient({
    deploymentKey,
    parentOrigin
}: WidgetEmbedClientProps) {
    const [bootstrap, setBootstrap] = useState<IWidgetBootstrap>();
    const [messages, setMessages] = useState<IWidgetMessage[]>([]);
    const [sessionId, setSessionId] = useState<string>();
    const [awaitingInput, setAwaitingInput] = useState(false);
    const [awaitingInputMode, setAwaitingInputMode] = useState<"question" | "choice" | "">("");
    const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
    const [isCompleted, setIsCompleted] = useState(false);
    const [draft, setDraft] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string>();

    const sessionStorageKey = useMemo(
        () => `${SESSION_STORAGE_PREFIX}:${deploymentKey}`,
        [deploymentKey]
    );

    const initializeWidget = useEffectEvent(async () => {
        setIsLoading(true);
        setError(undefined);

        try {
            const bootstrapResponse = await fetch(`/widget/runtime/${encodeURIComponent(deploymentKey)}/bootstrap`, {
                headers: {
                    "X-Conversa-Embed-Origin": parentOrigin
                }
            });

            if (!bootstrapResponse.ok) {
                throw new Error(await readWidgetError(bootstrapResponse, "The widget could not be loaded for this deployment."));
            }

            const bootstrapPayload = unwrapWidgetResponse<IWidgetBootstrap>(await bootstrapResponse.json());
            setBootstrap(bootstrapPayload);

            const storedSessionId = typeof window !== "undefined"
                ? window.localStorage.getItem(sessionStorageKey) ?? ""
                : "";

            const sessionResponse = await fetch(`/widget/runtime/${encodeURIComponent(deploymentKey)}/sessions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Conversa-Embed-Origin": parentOrigin
                },
                body: JSON.stringify({ sessionId: storedSessionId })
            });

            if (!sessionResponse.ok) {
                throw new Error(await readWidgetError(sessionResponse, "The widget session could not be started."));
            }

            const sessionPayload = unwrapWidgetResponse<IWidgetSessionResponse>(await sessionResponse.json());
            setSessionId(sessionPayload.sessionId);
            setMessages(sessionPayload.messages ?? []);
            setAwaitingInput(sessionPayload.awaitingInput);
            setAwaitingInputMode(sessionPayload.awaitingInputMode);
            setSuggestedReplies(sessionPayload.suggestedReplies);
            setIsCompleted(sessionPayload.isCompleted);

            if (typeof window !== "undefined") {
                window.localStorage.setItem(sessionStorageKey, sessionPayload.sessionId);
            }
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "The widget could not be initialized.");
        } finally {
            setIsLoading(false);
        }
    });

    useEffect(() => {
        void initializeWidget();
    }, [deploymentKey, parentOrigin]);

    const handleSend = async () => {
        if (!draft.trim() || !sessionId) {
            return;
        }

        setIsSending(true);

        try {
            const response = await fetch(
                `/widget/runtime/${encodeURIComponent(deploymentKey)}/sessions/${encodeURIComponent(sessionId)}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Conversa-Embed-Origin": parentOrigin
                    },
                    body: JSON.stringify({ message: draft.trim() })
                }
            );

            if (!response.ok) {
                throw new Error(await readWidgetError(response, "The message could not be sent."));
            }

            const payload = unwrapWidgetResponse<IWidgetSessionResponse>(await response.json());
            setMessages((current) => [...current, ...(payload.messages ?? [])]);
            setAwaitingInput(payload.awaitingInput);
            setAwaitingInputMode(payload.awaitingInputMode);
            setSuggestedReplies(payload.suggestedReplies);
            setIsCompleted(payload.isCompleted);
            setDraft("");
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "The widget message could not be sent.");
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = () => {
        if (typeof window !== "undefined") {
            window.parent.postMessage({ type: "conversa-widget-close" }, "*");
        }
    };

    const handleSuggestedReply = async (reply: string) => {
        setDraft(reply);

        if (!sessionId) {
            return;
        }

        setIsSending(true);

        try {
            const response = await fetch(
                `/widget/runtime/${encodeURIComponent(deploymentKey)}/sessions/${encodeURIComponent(sessionId)}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Conversa-Embed-Origin": parentOrigin
                    },
                    body: JSON.stringify({ message: reply })
                }
            );

            if (!response.ok) {
                throw new Error("The message could not be sent.");
            }

            const payload = await response.json() as IWidgetSessionResponse;
            setMessages((current) => [...current, ...payload.messages]);
            setAwaitingInput(payload.awaitingInput);
            setAwaitingInputMode(payload.awaitingInputMode);
            setSuggestedReplies(payload.suggestedReplies);
            setIsCompleted(payload.isCompleted);
            setDraft("");
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "The widget message could not be sent.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div
            style={{
                width: "100%",
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                background: "#ffffff",
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid #e5e7eb"
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    background: bootstrap?.themeColor ?? "#2563EB",
                    color: "#ffffff"
                }}
            >
                <div>
                    <Title level={5} style={{ color: "#ffffff", margin: 0 }}>
                        {bootstrap?.botName ?? "Conversa Widget"}
                    </Title>
                    <Text style={{ color: "rgba(255,255,255,0.88)" }}>
                        Live support chat
                    </Text>
                </div>
                <Button type="text" onClick={handleClose} style={{ color: "#ffffff" }}>
                    Close
                </Button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12, background: "#f8fafc" }}>
                {isLoading ? <Spin /> : null}
                {error ? (
                    <div style={{ background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 12 }}>
                        {error}
                    </div>
                ) : null}
                {!isLoading && !error && messages.map((message, index) => (
                    <div
                        key={`${message.role}-${message.createdAt}-${index}`}
                        style={{
                            alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                            maxWidth: "85%",
                            padding: "12px 14px",
                            borderRadius: 14,
                            background: message.role === "user" ? (bootstrap?.themeColor ?? "#2563EB") : "#ffffff",
                            color: message.role === "user" ? "#ffffff" : "#0f172a",
                            boxShadow: message.role === "user" ? "none" : "0 10px 24px rgba(15,23,42,0.08)"
                        }}
                    >
                        {message.content}
                    </div>
                ))}
            </div>

            <div style={{ padding: 16, borderTop: "1px solid #e5e7eb", background: "#ffffff" }}>
                <Input.TextArea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    placeholder={awaitingInput ? awaitingInputMode === "choice" ? "Choose a button or type a matching option..." : "Type your reply..." : isCompleted ? "Conversation ended" : "Waiting for the bot..."}
                    disabled={!awaitingInput || isCompleted || Boolean(error)}
                />
                {awaitingInputMode === "choice" && suggestedReplies.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                        {suggestedReplies.map((reply) => (
                            <Button
                                key={reply}
                                onClick={() => void handleSuggestedReply(reply)}
                                disabled={isSending || isCompleted || Boolean(error)}
                            >
                                {reply}
                            </Button>
                        ))}
                    </div>
                ) : null}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <Text type="secondary">
                        {awaitingInput ? "Reply required" : isCompleted ? "Completed" : "Auto-running"}
                    </Text>
                    <Button
                        type="primary"
                        onClick={handleSend}
                        loading={isSending}
                        disabled={!awaitingInput || !draft.trim() || isCompleted || Boolean(error)}
                        style={{ background: bootstrap?.themeColor ?? "#2563EB" }}
                    >
                        Send
                    </Button>
                </div>
            </div>
        </div>
    );
}

function unwrapWidgetResponse<T>(payload: unknown): T {
    if (payload && typeof payload === "object" && "result" in payload) {
        const wrappedPayload = payload as IAbpWidgetResponse<T>;

        if (wrappedPayload.result !== undefined) {
            return wrappedPayload.result;
        }

        throw new Error(wrappedPayload.error?.details ?? wrappedPayload.error?.message ?? "The widget response was empty.");
    }

    return payload as T;
}

async function readWidgetError(response: Response, fallbackMessage: string): Promise<string> {
    try {
        const payload = await response.json() as IWidgetErrorResponse | IAbpWidgetResponse<unknown>;

        if (payload && typeof payload === "object") {
            if ("error" in payload && typeof payload.error === "string" && payload.error) {
                return payload.error;
            }

            if ("error" in payload && payload.error && typeof payload.error === "object") {
                const wrappedError = payload.error as { message?: string; details?: string; };
                return wrappedError.details ?? wrappedError.message ?? fallbackMessage;
            }
        }
    } catch {
        // ignore response parsing and fall back to the generic message
    }

    return fallbackMessage;
}
