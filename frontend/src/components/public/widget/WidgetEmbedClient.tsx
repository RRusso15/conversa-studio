"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Button, Input, Spin, Typography } from "antd";
import { sendHandoffEmail } from "@/utils/handoff-email";

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
    assistantTitle?: string;
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
    handoff?: IWidgetHandoff;
}

interface IWidgetHandoff {
    nodeId: string;
    inboxKey: string;
    inboxLabel: string;
    recipientEmail: string;
    contactEmail: string;
    variables: Record<string, string>;
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
const HANDOFF_STORAGE_PREFIX = "conversa-widget-handoff";
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
    const [handoffError, setHandoffError] = useState<string>();
    const [handoffStatus, setHandoffStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [pendingHandoff, setPendingHandoff] = useState<IWidgetHandoff>();
    const transcriptEndRef = useRef<HTMLDivElement | null>(null);
    const messagesRef = useRef<IWidgetMessage[]>([]);

    const sessionStorageKey = useMemo(
        () => `${SESSION_STORAGE_PREFIX}:${deploymentKey}`,
        [deploymentKey]
    );

    const themeColor = bootstrap?.themeColor ?? "#2563EB";
    const themeColorMuted = withAlpha(themeColor, 0.1);
    const shellStyles = createWidgetStyles(themeColor, themeColorMuted);
    const assistantTitle = resolveAssistantTitle(bootstrap?.assistantTitle, bootstrap?.botName, bootstrap?.launcherLabel);
    const assistantSubtitle = resolveAssistantSubtitle(assistantTitle);

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
                throw new Error(
                    await readWidgetError(
                        bootstrapResponse,
                        "The widget could not be loaded for this deployment."
                    )
                );
            }

            const bootstrapPayload = unwrapWidgetResponse<IWidgetBootstrap>(await bootstrapResponse.json());
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
        messagesRef.current = messages;
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, isSending, error]);

    useEffect(() => {
        if (!pendingHandoff || !bootstrap) {
            return;
        }

        const handoffStorageKey = `${HANDOFF_STORAGE_PREFIX}:${pendingHandoff.nodeId}:${sessionId ?? ""}`;
        const hasAlreadySent = typeof window !== "undefined" && window.localStorage.getItem(handoffStorageKey) === "sent";

        if (hasAlreadySent) {
            setPendingHandoff(undefined);
            setHandoffStatus("sent");
            return;
        }

        void (async () => {
            setHandoffStatus("sending");
            setHandoffError(undefined);

            try {
                await sendHandoffEmail({
                    recipientEmail: pendingHandoff.recipientEmail,
                    recipientLabel: pendingHandoff.inboxLabel,
                    contactEmail: pendingHandoff.contactEmail,
                    botName: bootstrap.botName,
                    deploymentKey: bootstrap.deploymentKey,
                    sessionId: sessionId ?? "",
                    transcript: buildTranscriptText(messagesRef.current),
                    variables: pendingHandoff.variables,
                });

                if (typeof window !== "undefined") {
                    window.localStorage.setItem(handoffStorageKey, "sent");
                }

                setHandoffStatus("sent");
            } catch (caughtError) {
                setHandoffStatus("error");
                setHandoffError(caughtError instanceof Error ? caughtError.message : "The handoff email could not be sent.");
            } finally {
                setPendingHandoff(undefined);
            }
        })();
    }, [bootstrap, pendingHandoff, sessionId]);

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
        setHandoffError(undefined);
        setHandoffStatus("idle");
        setPendingHandoff(undefined);
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
            throw new Error(await readWidgetError(response, "The widget session could not be started."));
        }

        const sessionPayload = unwrapWidgetResponse<IWidgetSessionResponse>(await response.json());
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
                throw new Error(await readWidgetError(response, "The message could not be sent."));
            }

            const payload = unwrapWidgetResponse<IWidgetSessionResponse>(await response.json());
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
        setMessages((currentMessages) => {
            const nextMessages = appendMessages ? [...currentMessages, ...(payload.messages ?? [])] : (payload.messages ?? []);
            messagesRef.current = nextMessages;
            return nextMessages;
        });
        setAwaitingInput(payload.awaitingInput);
        setAwaitingInputMode(payload.awaitingInputMode);
        setSuggestedReplies(payload.suggestedReplies ?? []);
        setIsCompleted(payload.isCompleted);
        setPendingHandoff(payload.handoff);

        if (typeof window !== "undefined") {
            window.localStorage.setItem(sessionStorageKey, payload.sessionId);
        }
    }

    return (
        <div style={shellStyles.shell}>
            <div style={shellStyles.header}>
                <div style={shellStyles.headerCopy}>
                    <div style={shellStyles.headerEyebrow}>Conversa assistant</div>
                    <Title level={5} style={shellStyles.headerTitle}>
                        {assistantTitle}
                    </Title>
                    <Text style={shellStyles.headerSubtitle}>
                        {assistantSubtitle}
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

                {!error && handoffError ? (
                    <div style={shellStyles.errorCard}>
                        <Text style={shellStyles.errorText}>{handoffError}</Text>
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
                {handoffStatus === "sending" ? (
                    <Text type="secondary" style={shellStyles.statusText}>
                        Sending handoff details to the team...
                    </Text>
                ) : null}

                {handoffStatus === "sent" ? (
                    <Text type="secondary" style={shellStyles.statusText}>
                        Handoff details were sent to the selected team inbox.
                    </Text>
                ) : null}

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
        return "Waiting for the assistant...";
    }

    if (awaitingInputMode === "choice") {
        return "Choose an option or type a matching reply...";
    }

    return "Write your reply...";
}

function resolveStatusLabel(awaitingInput: boolean, isCompleted: boolean, isSending: boolean): string {
    if (isSending) {
        return "Assistant is replying";
    }

    if (isCompleted) {
        return "Conversation completed";
    }

    return awaitingInput ? "Reply requested" : "Assistant is preparing a response";
}

function buildTranscriptText(messages: IWidgetMessage[]): string {
    return messages
        .map((message) => `${message.role === "user" ? "User" : "Bot"}: ${message.content}`)
        .join("\n\n");
}

function resolveAssistantTitle(
    explicitAssistantTitle?: string,
    botName?: string,
    launcherLabel?: string
): string {
    const candidates = [explicitAssistantTitle, botName, launcherLabel]
        .map((candidate) => sanitizeAssistantLabel(candidate))
        .filter((candidate): candidate is string => Boolean(candidate));

    return candidates[0] ?? "Assistant";
}

function resolveAssistantSubtitle(assistantTitle: string): string {
    return assistantTitle === "Assistant"
        ? "Ask a question whenever you are ready."
        : `Ask ${assistantTitle} a question whenever you are ready.`;
}

function sanitizeAssistantLabel(value?: string): string | undefined {
    if (!value) {
        return undefined;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return undefined;
    }

    const withoutCallToAction = trimmedValue
        .replace(/^(chat with|talk to|open|launch|start conversation with|start conversation|ask)\s+/i, "")
        .replace(/\b(widget|chatbot|bot)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();

    const normalizedValue = withoutCallToAction
        .replace(/\b(ai|test|demo|node)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim()
        .replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "");

    if (!normalizedValue) {
        return undefined;
    }

    const compactValue = normalizedValue.length > 36
        ? normalizedValue.slice(0, 36).trim()
        : normalizedValue;

    return compactValue
        .split(/\s+/)
        .map((segment) => segment ? `${segment.charAt(0).toUpperCase()}${segment.slice(1)}` : "")
        .join(" ");
}

async function ensureMinimumTypingDelay(startedAt: number): Promise<void> {
    const remainingDelay = MIN_TYPING_DISPLAY_MS - (Date.now() - startedAt);
    if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
    }
}

function unwrapWidgetResponse<T>(payload: unknown): T {
    if (payload && typeof payload === "object" && "result" in payload) {
        const wrappedPayload = payload as IAbpWidgetResponse<T>;

        if (wrappedPayload.result !== undefined) {
            return wrappedPayload.result;
        }

        throw new Error(
            wrappedPayload.error?.details ??
            wrappedPayload.error?.message ??
            "The widget response was empty."
        );
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
                const wrappedError = payload.error as { message?: string; details?: string };
                return wrappedError.details ?? wrappedError.message ?? fallbackMessage;
            }
        }
    } catch {
        // ignore response parsing and fall back to the generic message
    }

    return fallbackMessage;
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
            gap: 6,
            maxWidth: "100%"
        },
        headerEyebrow: {
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.66)",
            fontWeight: 700
        },
        headerTitle: {
            color: "#ffffff",
            margin: 0,
            lineHeight: 1.1
        },
        headerSubtitle: {
            color: "rgba(255,255,255,0.84)",
            maxWidth: 320
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
