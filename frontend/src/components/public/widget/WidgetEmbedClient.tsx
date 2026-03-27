"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, Spin, Typography } from "antd";

const { Text, Title } = Typography;

interface WidgetEmbedClientProps {
    deploymentKey: string;
    apiBaseUrl: string;
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
    isCompleted: boolean;
}

const SESSION_STORAGE_PREFIX = "conversa-widget-session";

export function WidgetEmbedClient({
    deploymentKey,
    apiBaseUrl,
    parentOrigin
}: WidgetEmbedClientProps) {
    const [bootstrap, setBootstrap] = useState<IWidgetBootstrap>();
    const [messages, setMessages] = useState<IWidgetMessage[]>([]);
    const [sessionId, setSessionId] = useState<string>();
    const [awaitingInput, setAwaitingInput] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [draft, setDraft] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string>();

    const sessionStorageKey = useMemo(
        () => `${SESSION_STORAGE_PREFIX}:${deploymentKey}`,
        [deploymentKey]
    );

    useEffect(() => {
        void initializeWidget();
    }, [deploymentKey, apiBaseUrl, parentOrigin]);

    const initializeWidget = async () => {
        setIsLoading(true);
        setError(undefined);

        try {
            const bootstrapResponse = await fetch(`${apiBaseUrl}/api/widget/deployments/${encodeURIComponent(deploymentKey)}/bootstrap`, {
                headers: {
                    "X-Conversa-Embed-Origin": parentOrigin
                }
            });

            if (!bootstrapResponse.ok) {
                throw new Error("The widget could not be loaded for this deployment.");
            }

            const bootstrapPayload = await bootstrapResponse.json() as IWidgetBootstrap;
            setBootstrap(bootstrapPayload);

            const storedSessionId = typeof window !== "undefined"
                ? window.localStorage.getItem(sessionStorageKey) ?? ""
                : "";

            const sessionResponse = await fetch(`${apiBaseUrl}/api/widget/deployments/${encodeURIComponent(deploymentKey)}/sessions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Conversa-Embed-Origin": parentOrigin
                },
                body: JSON.stringify({ sessionId: storedSessionId })
            });

            if (!sessionResponse.ok) {
                throw new Error("The widget session could not be started.");
            }

            const sessionPayload = await sessionResponse.json() as IWidgetSessionResponse;
            setSessionId(sessionPayload.sessionId);
            setMessages(sessionPayload.messages);
            setAwaitingInput(sessionPayload.awaitingInput);
            setIsCompleted(sessionPayload.isCompleted);

            if (typeof window !== "undefined") {
                window.localStorage.setItem(sessionStorageKey, sessionPayload.sessionId);
            }
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "The widget could not be initialized.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!draft.trim() || !sessionId) {
            return;
        }

        setIsSending(true);

        try {
            const response = await fetch(
                `${apiBaseUrl}/api/widget/deployments/${encodeURIComponent(deploymentKey)}/sessions/${encodeURIComponent(sessionId)}/messages`,
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
                throw new Error("The message could not be sent.");
            }

            const payload = await response.json() as IWidgetSessionResponse;
            setMessages((current) => [...current, ...payload.messages]);
            setAwaitingInput(payload.awaitingInput);
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
                    placeholder={awaitingInput ? "Type your reply..." : isCompleted ? "Conversation ended" : "Waiting for the bot..."}
                    disabled={!awaitingInput || isCompleted || Boolean(error)}
                />
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
