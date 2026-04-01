"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
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

const SESSION_STORAGE_PREFIX = "conversa-widget-session";
const MIN_TYPING_DISPLAY_MS = 700;
const POWERED_BY_LABEL = "Powered by Conversa Studio";

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
    const transcriptEndRef = useRef<HTMLDivElement | null>(null);

    const sessionStorageKey = useMemo(
        () => `${SESSION_STORAGE_PREFIX}:${deploymentKey}`,
        [deploymentKey]
    );

    const themeColor = bootstrap?.themeColor ?? "#2563EB";
    const themeColorMuted = withAlpha(themeColor, 0.1);
    const shellStyles = createWidgetStyles(themeColor, themeColorMuted);

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
                throw new Error("The widget could not be loaded for this deployment.");
            }

            const bootstrapPayload = await bootstrapResponse.json() as IWidgetBootstrap;
            setBootstrap(bootstrapPayload);

            const storedSessionId = typeof window !== "undefined"
                ? window.localStorage.getItem(sessionStorageKey) ?? ""
                : "";

            await startSession(storedSessionId);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "The widget could not be initialized.");
        } finally {
            setIsLoading(false);
        }
    });

    useEffect(() => {
        void initializeWidget();
    }, [deploymentKey, parentOrigin]);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, isSending, error]);

    const handleSend = async () => {
        const trimmedDraft = draft.trim();
        if (!trimmedDraft || !sessionId) {
            return;
        }

        await sendRuntimeMessage(trimmedDraft);
    };

    const handleClose = () => {
        if (typeof window !== "undefined") {
            window.parent.postMessage({ type: "conversa-widget-close" }, "*");
        }
    };

    const handleSuggestedReply = async (reply: string) => {
        if (!sessionId) {
            return;
        }

        setDraft(reply);
        await sendRuntimeMessage(reply);
    };

    const handleNewConversation = async () => {
        setError(undefined);
        setDraft("");

        if (typeof window !== "undefined") {
            window.localStorage.removeItem(sessionStorageKey);
        }

        await startSession("");
    };

    async function startSession(existingSessionId?: string): Promise<void> {
        const response = await fetch(`/widget/runtime/${encodeURIComponent(deploymentKey)}/sessions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Conversa-Embed-Origin": parentOrigin
            },
            body: JSON.stringify({ sessionId: existingSessionId ?? "" })
        });

        if (!response.ok) {
            throw new Error("The widget session could not be started.");
        }

        const sessionPayload = await response.json() as IWidgetSessionResponse;
        applySessionPayload(sessionPayload, false);
    }

    async function sendRuntimeMessage(message: string): Promise<void> {
        if (!sessionId) {
            return;
        }

        setIsSending(true);
        setError(undefined);
        const startedAt = Date.now();

        try {
            const response = await fetch(
                `/widget/runtime/${encodeURIComponent(deploymentKey)}/sessions/${encodeURIComponent(sessionId)}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Conversa-Embed-Origin": parentOrigin
                    },
                    body: JSON.stringify({ message })
                }
            );

            if (!response.ok) {
                throw new Error("The message could not be sent.");
            }

            const payload = await response.json() as IWidgetSessionResponse;
            await ensureMinimumTypingDelay(startedAt);
            applySessionPayload(payload, true);
            setDraft("");
        } catch (caughtError) {
            await ensureMinimumTypingDelay(startedAt);
            setError(caughtError instanceof Error ? caughtError.message : "The widget message could not be sent.");
        } finally {
            setIsSending(false);
        }
    }

    function applySessionPayload(payload: IWidgetSessionResponse, appendMessages: boolean): void {
        setSessionId(payload.sessionId);
        setMessages((currentMessages) => appendMessages ? [...currentMessages, ...payload.messages] : payload.messages);
        setAwaitingInput(payload.awaitingInput);
        setAwaitingInputMode(payload.awaitingInputMode);
        setSuggestedReplies(payload.suggestedReplies);
        setIsCompleted(payload.isCompleted);

        if (typeof window !== "undefined") {
            window.localStorage.setItem(sessionStorageKey, payload.sessionId);
        }
    }

    return (
        <div style={shellStyles.shell}>
            <div style={shellStyles.header}>
                <div style={shellStyles.headerCopy}>
                    <div style={shellStyles.headerEyebrow}>Live bot assistant</div>
                    <Title level={5} style={shellStyles.headerTitle}>
                        {bootstrap?.botName ?? "Conversa Widget"}
                    </Title>
                    <Text style={shellStyles.headerSubtitle}>
                        Ask a question and continue when you are ready.
                    </Text>
                </div>
                <div style={shellStyles.headerActions}>
                    <Button
                        size="small"
                        onClick={() => void handleNewConversation()}
                        disabled={isLoading || isSending}
                        style={shellStyles.secondaryButton}
                    >
                        New conversation
                    </Button>
                    <Button
                        type="text"
                        onClick={handleClose}
                        style={shellStyles.headerCloseButton}
                    >
                        Close
                    </Button>
                </div>
            </div>

            <div style={shellStyles.transcript}>
                {isLoading ? (
                    <div style={shellStyles.stateCard}>
                        <Spin />
                        <Text style={shellStyles.stateText}>Opening the conversation…</Text>
                    </div>
                ) : null}

                {error ? (
                    <div style={shellStyles.errorCard}>
                        <Text style={shellStyles.errorText}>{error}</Text>
                    </div>
                ) : null}

                {!isLoading && !error && messages.length === 0 ? (
                    <div style={shellStyles.stateCard}>
                        <Text style={shellStyles.stateText}>This conversation is ready to begin.</Text>
                    </div>
                ) : null}

                {!isLoading && !error && messages.map((message, index) => (
                    <div
                        key={`${message.role}-${message.createdAt}-${index}`}
                        style={message.role === "user" ? shellStyles.userMessageRow : shellStyles.botMessageRow}
                    >
                        <div style={message.role === "user" ? shellStyles.userBubble : shellStyles.botBubble}>
                            <Text style={message.role === "user" ? shellStyles.userText : shellStyles.botText}>
                                {message.content}
                            </Text>
                        </div>
                    </div>
                ))}

                {!isLoading && !error && isSending ? (
                    <div style={shellStyles.botMessageRow}>
                        <div style={shellStyles.typingBubble}>
                            <div style={shellStyles.typingDots}>
                                <span style={shellStyles.typingDot} />
                                <span style={shellStyles.typingDot} />
                                <span style={shellStyles.typingDot} />
                            </div>
                            <Text style={shellStyles.typingLabel}>Thinking…</Text>
                        </div>
                    </div>
                ) : null}

                <div ref={transcriptEndRef} />
            </div>

            <div style={shellStyles.composer}>
                {awaitingInputMode === "choice" && suggestedReplies.length > 0 ? (
                    <div style={shellStyles.suggestedReplies}>
                        {suggestedReplies.map((reply) => (
                            <Button
                                key={reply}
                                onClick={() => void handleSuggestedReply(reply)}
                                disabled={isSending || isCompleted || Boolean(error)}
                                style={shellStyles.suggestedReplyButton}
                            >
                                {reply}
                            </Button>
                        ))}
                    </div>
                ) : null}

                <Input.TextArea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    placeholder={resolvePlaceholder(awaitingInput, awaitingInputMode, isCompleted)}
                    disabled={!awaitingInput || isCompleted || Boolean(error) || isSending}
                    style={shellStyles.input}
                />

                <div style={shellStyles.composerFooter}>
                    <Text type="secondary" style={shellStyles.statusText}>
                        {resolveStatusLabel(awaitingInput, isCompleted, isSending)}
                    </Text>
                    <Button
                        type="primary"
                        onClick={() => void handleSend()}
                        loading={isSending}
                        disabled={!awaitingInput || !draft.trim() || isCompleted || Boolean(error)}
                        style={shellStyles.primaryButton}
                    >
                        Send
                    </Button>
                </div>

                <div style={shellStyles.brandingFooter}>
                    <Text style={shellStyles.brandingText}>{POWERED_BY_LABEL}</Text>
                </div>
            </div>
        </div>
    );
}

function resolvePlaceholder(
    awaitingInput: boolean,
    awaitingInputMode: "question" | "choice" | "",
    isCompleted: boolean
): string {
    if (isCompleted) {
        return "Conversation ended";
    }

    if (!awaitingInput) {
        return "Waiting for the bot…";
    }

    if (awaitingInputMode === "choice") {
        return "Choose a button or type a matching option…";
    }

    return "Type your reply…";
}

function resolveStatusLabel(awaitingInput: boolean, isCompleted: boolean, isSending: boolean): string {
    if (isSending) {
        return "Bot is replying";
    }

    if (isCompleted) {
        return "Conversation completed";
    }

    return awaitingInput ? "Reply required" : "Bot is working";
}

async function ensureMinimumTypingDelay(startedAt: number): Promise<void> {
    const remainingDelay = MIN_TYPING_DISPLAY_MS - (Date.now() - startedAt);
    if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
    }
}

function withAlpha(hexColor: string, alpha: number): string {
    const normalizedHex = hexColor.replace("#", "");
    if (normalizedHex.length !== 6) {
        return hexColor;
    }

    const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
    const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
    const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function createWidgetStyles(themeColor: string, themeColorMuted: string): Record<string, CSSProperties> {
    return {
        shell: {
            width: "100%",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            borderRadius: 18,
            overflow: "hidden",
            border: "1px solid #dbe4ef"
        },
        header: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            padding: "18px 18px 16px",
            background: `linear-gradient(135deg, ${themeColor} 0%, #0f172a 100%)`,
            color: "#ffffff"
        },
        headerCopy: {
            display: "flex",
            flexDirection: "column",
            gap: 4
        },
        headerEyebrow: {
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.72)"
        },
        headerTitle: {
            color: "#ffffff",
            margin: 0
        },
        headerSubtitle: {
            color: "rgba(255,255,255,0.86)"
        },
        headerActions: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "flex-end"
        },
        headerCloseButton: {
            color: "#ffffff"
        },
        secondaryButton: {
            borderColor: "rgba(255,255,255,0.32)",
            color: "#ffffff",
            background: "rgba(255,255,255,0.08)"
        },
        transcript: {
            flex: 1,
            overflowY: "auto",
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            background: "radial-gradient(circle at top, rgba(255,255,255,0.95) 0%, #f8fafc 65%)"
        },
        stateCard: {
            alignSelf: "center",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            borderRadius: 16,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 24px rgba(15,23,42,0.06)"
        },
        stateText: {
            color: "#475569"
        },
        errorCard: {
            alignSelf: "stretch",
            padding: "13px 14px",
            borderRadius: 14,
            background: "#fff1f2",
            border: "1px solid #fecdd3"
        },
        errorText: {
            color: "#9f1239"
        },
        botMessageRow: {
            display: "flex",
            justifyContent: "flex-start"
        },
        userMessageRow: {
            display: "flex",
            justifyContent: "flex-end"
        },
        botBubble: {
            maxWidth: "85%",
            padding: "12px 14px",
            borderRadius: "16px 16px 16px 6px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 12px 24px rgba(15,23,42,0.07)"
        },
        userBubble: {
            maxWidth: "85%",
            padding: "12px 14px",
            borderRadius: "16px 16px 6px 16px",
            background: `linear-gradient(135deg, ${themeColor} 0%, #1d4ed8 100%)`,
            boxShadow: `0 14px 24px ${themeColorMuted}`
        },
        botText: {
            color: "#0f172a",
            whiteSpace: "pre-wrap"
        },
        userText: {
            color: "#ffffff",
            whiteSpace: "pre-wrap"
        },
        typingBubble: {
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderRadius: "16px 16px 16px 6px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 12px 24px rgba(15,23,42,0.07)"
        },
        typingDots: {
            display: "flex",
            gap: 4,
            alignItems: "center"
        },
        typingDot: {
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#94a3b8"
        },
        typingLabel: {
            color: "#64748b"
        },
        composer: {
            padding: 16,
            borderTop: "1px solid #e2e8f0",
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            gap: 12
        },
        suggestedReplies: {
            display: "flex",
            flexWrap: "wrap",
            gap: 8
        },
        suggestedReplyButton: {
            borderColor: "#dbe4ef",
            color: "#0f172a",
            background: "#f8fafc"
        },
        input: {
            borderRadius: 14,
            background: "#ffffff"
        },
        composerFooter: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12
        },
        statusText: {
            color: "#64748b"
        },
        primaryButton: {
            background: themeColor,
            borderColor: themeColor,
            boxShadow: `0 12px 24px ${themeColorMuted}`
        },
        brandingFooter: {
            display: "flex",
            justifyContent: "center",
            paddingTop: 2
        },
        brandingText: {
            color: "#94a3b8",
            fontSize: 12
        }
    };
}
