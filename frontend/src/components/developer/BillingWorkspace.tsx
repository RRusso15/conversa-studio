"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import {
    App,
    Alert,
    Button,
    Card,
    Col,
    Descriptions,
    Empty,
    Row,
    Skeleton,
    Space,
    Tag,
    Typography
} from "antd";
import { CreditCardOutlined, LockOutlined } from "@ant-design/icons";
import { InfoNotice } from "./InfoNotice";
import { PageHeader } from "./PageHeader";
import { useBillingActions, useBillingState } from "@/providers/billingProvider";

const { Paragraph, Text, Title } = Typography;

declare global {
    interface Window {
        paypal?: {
            Buttons: (options: {
                style?: Record<string, string>;
                createSubscription: (data: unknown, actions: {
                    subscription: {
                        create: (input: {
                            plan_id: string;
                        }) => Promise<string>;
                    };
                }) => Promise<string>;
                onApprove: (data: {
                    subscriptionID?: string;
                }) => Promise<void>;
                onError?: (error: unknown) => void;
            }) => {
                render: (selector: string) => Promise<void>;
                close?: () => void;
            };
        };
    }
}

const PAYPAL_BUTTON_CONTAINER_ID = "paypal-billing-button-container";

export function BillingWorkspace() {
    const { notification } = App.useApp();
    const { overview, portalConfig, status, errorMessage } = useBillingState();
    const { getBilling, confirmPayPalSubscription, cancelSubscription } = useBillingActions();
    const [isPayPalSdkReady, setIsPayPalSdkReady] = useState(false);
    const [paypalErrorMessage, setPayPalErrorMessage] = useState<string>();
    const hasRenderedButtonsRef = useRef(false);

    useEffect(() => {
        void getBilling();
    }, [getBilling]);

    useEffect(() => {
        if (!isPayPalSdkReady || !portalConfig?.isAvailable || !portalConfig.clientId || !portalConfig.planId || !overview?.canStartSubscription) {
            return;
        }

        if (!window.paypal || hasRenderedButtonsRef.current) {
            return;
        }

        hasRenderedButtonsRef.current = true;

        void window.paypal.Buttons({
            style: {
                shape: "pill",
                color: "silver",
                layout: "vertical",
                label: "subscribe"
            },
            createSubscription: (_data, actions) => actions.subscription.create({
                plan_id: portalConfig.planId
            }),
            onApprove: async (data) => {
                if (!data.subscriptionID) {
                    throw new Error("PayPal did not return a subscription id.");
                }

                await confirmPayPalSubscription(data.subscriptionID);
                notification.success({
                    message: "Subscription confirmed",
                    description: "Your workspace billing state has been updated."
                });
            },
            onError: (error) => {
                const message = error instanceof Error ? error.message : "PayPal checkout could not be started.";
                setPayPalErrorMessage(message);
            }
        }).render(`#${PAYPAL_BUTTON_CONTAINER_ID}`);
    }, [confirmPayPalSubscription, isPayPalSdkReady, notification, overview?.canStartSubscription, portalConfig]);

    const isBusy = status === "loading" && !overview;
    const isCancelling = status === "cancelling";
    const showPayPalScript = portalConfig?.isAvailable && Boolean(portalConfig.clientId) && overview?.canStartSubscription;
    const statusTagColor = useMemo(() => resolveStatusColor(overview?.status), [overview?.status]);

    const handleCancelSubscription = async () => {
        try {
            await cancelSubscription();
            notification.success({
                message: "Subscription cancelled",
                description: "The current workspace subscription was cancelled successfully."
            });
        } catch (error) {
            notification.error({
                message: "Cancellation failed",
                description: error instanceof Error ? error.message : "We could not cancel this subscription."
            });
        }
    };

    return (
        <>
            {showPayPalScript ? (
                <Script
                    id="paypal-billing-sdk"
                    src={`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(portalConfig?.clientId ?? "")}&vault=true&intent=subscription`}
                    strategy="afterInteractive"
                    onLoad={() => setIsPayPalSdkReady(true)}
                    onError={() => setPayPalErrorMessage("PayPal checkout could not be loaded in this environment.")}
                />
            ) : null}

            <PageHeader
                title="Billing"
                description="Manage the workspace subscription, PayPal checkout, and current trial or renewal state."
            />

            <InfoNotice
                title="Workspace subscription"
                description="Billing is tenant-scoped. Updates here apply to the current workspace and are synchronized from PayPal."
                style={{ marginBottom: 20 }}
            />

            {errorMessage ? (
                <Alert
                    type="error"
                    showIcon
                    message="Billing could not be loaded"
                    description={errorMessage}
                    style={{ marginBottom: 20 }}
                />
            ) : null}

            <Row gutter={[20, 20]}>
                <Col xs={24} xl={14}>
                    <Card>
                        {isBusy ? (
                            <Skeleton active paragraph={{ rows: 8 }} />
                        ) : overview ? (
                            <Space direction="vertical" size="large" style={{ width: "100%" }}>
                                <Space align="start" style={{ justifyContent: "space-between", width: "100%" }}>
                                    <div>
                                        <Text type="secondary">Current plan</Text>
                                        <Title level={2} style={{ margin: "8px 0 4px" }}>
                                            {overview.planName}
                                        </Title>
                                        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                                            {overview.priceLabel} with {overview.trialLabel.toLowerCase()}.
                                        </Paragraph>
                                    </div>
                                    <Tag color={statusTagColor}>{formatStatusLabel(overview.status)}</Tag>
                                </Space>

                                <Descriptions
                                    bordered
                                    size="small"
                                    column={1}
                                    items={[
                                        {
                                            key: "provider",
                                            label: "Provider",
                                            children: overview.provider
                                        },
                                        {
                                            key: "subscription",
                                            label: "Subscription ID",
                                            children: overview.providerSubscriptionId ?? "Not started"
                                        },
                                        {
                                            key: "trialEndsAt",
                                            label: "Trial ends",
                                            children: formatOptionalDate(overview.trialEndsAt)
                                        },
                                        {
                                            key: "currentPeriodEndAt",
                                            label: "Current period end",
                                            children: formatOptionalDate(overview.currentPeriodEndAt)
                                        },
                                        {
                                            key: "lastSyncedAt",
                                            label: "Last synced",
                                            children: formatOptionalDate(overview.lastSyncedAt)
                                        },
                                        {
                                            key: "payerEmail",
                                            label: "Payer email",
                                            children: overview.payerEmail ?? "Unavailable"
                                        }
                                    ]}
                                />

                                {overview.canCancelSubscription ? (
                                    <Button
                                        danger
                                        icon={<LockOutlined />}
                                        loading={isCancelling}
                                        onClick={() => void handleCancelSubscription()}
                                    >
                                        Cancel subscription
                                    </Button>
                                ) : null}
                            </Space>
                        ) : (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Billing is not available yet." />
                        )}
                    </Card>
                </Col>

                <Col xs={24} xl={10}>
                    <Card>
                        {isBusy ? (
                            <Skeleton active paragraph={{ rows: 6 }} />
                        ) : (
                            <Space direction="vertical" size="large" style={{ width: "100%" }}>
                                <div>
                                    <Space align="center" size="middle">
                                        <span style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 14,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: "#eff6ff",
                                            color: "#1d4ed8",
                                            fontSize: 20
                                        }}>
                                            <CreditCardOutlined />
                                        </span>
                                        <div>
                                            <Title level={4} style={{ margin: 0 }}>
                                                {portalConfig?.planName ?? "Pro"} workspace billing
                                            </Title>
                                            <Text type="secondary">
                                                {portalConfig?.priceLabel ?? "$1/month"} · {portalConfig?.trialLabel ?? "7-day free trial"}
                                            </Text>
                                        </div>
                                    </Space>
                                </div>

                                {!portalConfig?.isAvailable ? (
                                    <Alert
                                        type="warning"
                                        showIcon
                                        message="PayPal is not configured"
                                        description={portalConfig?.unavailableReason ?? "Add the PayPal host configuration to enable checkout."}
                                    />
                                ) : null}

                                {paypalErrorMessage ? (
                                    <Alert
                                        type="error"
                                        showIcon
                                        message="PayPal checkout issue"
                                        description={paypalErrorMessage}
                                    />
                                ) : null}

                                {overview?.canStartSubscription && portalConfig?.isAvailable ? (
                                    <div>
                                        <Paragraph type="secondary">
                                            Start the subscription in PayPal. After approval, the workspace billing state will refresh automatically here.
                                        </Paragraph>
                                        <div id={PAYPAL_BUTTON_CONTAINER_ID} />
                                    </div>
                                ) : (
                                    <Alert
                                        type="success"
                                        showIcon
                                        message="Billing is already in progress"
                                        description={overview
                                            ? `Current status: ${formatStatusLabel(overview.status)}. Checkout is hidden until this workspace needs a new subscription.`
                                            : "Billing information will appear here once the workspace record is available."}
                                    />
                                )}
                            </Space>
                        )}
                    </Card>
                </Col>
            </Row>
        </>
    );
}

function formatOptionalDate(value?: string): string {
    if (!value) {
        return "Unavailable";
    }

    return new Date(value).toLocaleString();
}

function formatStatusLabel(status?: string): string {
    if (!status) {
        return "Unknown";
    }

    return status
        .split("_")
        .map((segment) => segment ? `${segment.charAt(0).toUpperCase()}${segment.slice(1)}` : "")
        .join(" ");
}

function resolveStatusColor(status?: string): string {
    if (status === "active") {
        return "green";
    }

    if (status === "trialing") {
        return "blue";
    }

    if (status === "past_due" || status === "suspended") {
        return "gold";
    }

    if (status === "cancelled" || status === "expired") {
        return "red";
    }

    return "default";
}
