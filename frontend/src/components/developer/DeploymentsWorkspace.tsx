"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    CopyOutlined,
    LinkOutlined,
    PlusOutlined,
    RocketOutlined
} from "@ant-design/icons";
import {
    Alert,
    App,
    Button,
    Card,
    Col,
    Drawer,
    Empty,
    Form,
    Input,
    Row,
    Select,
    Skeleton,
    Space,
    Tag,
    Typography
} from "antd";
import { PageHeader } from "./PageHeader";
import { useStyles } from "./styles";
import { useBotActions, useBotState } from "@/providers/botProvider";
import {
    activateDeployment,
    createDeployment,
    deactivateDeployment,
    getDeployments,
    getDeploymentSnippet,
    toDeploymentRequestError,
    updateDeployment,
    type IDeploymentDefinition
} from "@/utils/deployment-api";

const { Paragraph, Text, Title } = Typography;
const DEFAULT_THEME_COLOR = "#2563EB";

interface DeploymentsWorkspaceProps {
    requestedBotId?: string;
}

interface IDeploymentFormValues {
    name: string;
    allowedDomainsText: string;
    launcherLabel: string;
    themeColor: string;
}

export function DeploymentsWorkspace({ requestedBotId }: DeploymentsWorkspaceProps) {
    const { styles } = useStyles();
    const { notification, message } = App.useApp();
    const [form] = Form.useForm<IDeploymentFormValues>();
    const { bots, isPending: botsPending, isError: botsError, errorMessage: botsErrorMessage } = useBotState();
    const { getBots } = useBotActions();
    const [deployments, setDeployments] = useState<IDeploymentDefinition[]>([]);
    const [isLoadingDeployments, setIsLoadingDeployments] = useState(true);
    const [deploymentError, setDeploymentError] = useState<string>();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedBotId, setSelectedBotId] = useState<string>();
    const [editingDeployment, setEditingDeployment] = useState<IDeploymentDefinition>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [snippetByDeploymentId, setSnippetByDeploymentId] = useState<Record<string, string>>({});

    useEffect(() => {
        void getBots();
    }, [getBots]);

    useEffect(() => {
        if (!bots?.length || !requestedBotId) {
            return;
        }

        if (bots.some((bot) => bot.id === requestedBotId)) {
            setSelectedBotId(requestedBotId);
        }
    }, [bots, requestedBotId]);

    useEffect(() => {
        void loadDeployments();
    }, []);

    const selectedBot = useMemo(
        () => bots?.find((bot) => bot.id === selectedBotId),
        [bots, selectedBotId]
    );

    const filteredDeployments = useMemo(
        () => selectedBotId
            ? deployments.filter((deployment) => deployment.botDefinitionId === selectedBotId)
            : deployments,
        [deployments, selectedBotId]
    );

    const openCreateDrawer = () => {
        setEditingDeployment(undefined);
        form.setFieldsValue({
            name: selectedBot ? `${selectedBot.name} Widget` : "",
            allowedDomainsText: "",
            launcherLabel: selectedBot ? `Chat with ${selectedBot.name}` : "",
            themeColor: DEFAULT_THEME_COLOR
        });
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (deployment: IDeploymentDefinition) => {
        setEditingDeployment(deployment);
        setSelectedBotId(deployment.botDefinitionId);
        form.setFieldsValue({
            name: deployment.name,
            allowedDomainsText: deployment.allowedDomains.join("\n"),
            launcherLabel: deployment.launcherLabel,
            themeColor: deployment.themeColor
        });
        setIsDrawerOpen(true);
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();

        if (!selectedBotId) {
            message.warning("Select a bot before creating a deployment.");
            return;
        }

        setIsSubmitting(true);

        try {
            const allowedDomains = parseDomains(values.allowedDomainsText);
            const savedDeployment = editingDeployment
                ? await updateDeployment({
                    id: editingDeployment.id,
                    name: values.name.trim(),
                    allowedDomains,
                    launcherLabel: values.launcherLabel.trim(),
                    themeColor: values.themeColor.trim()
                })
                : await createDeployment({
                    botDefinitionId: selectedBotId,
                    name: values.name.trim(),
                    allowedDomains,
                    launcherLabel: values.launcherLabel.trim(),
                    themeColor: values.themeColor.trim()
                });

            setDeployments((current) => upsertDeployment(current, savedDeployment));
            setIsDrawerOpen(false);
            notification.success({
                message: editingDeployment ? "Deployment updated" : "Deployment created",
                description: editingDeployment
                    ? "Widget deployment settings have been saved."
                    : "Your widget deployment has been created."
            });
        } catch (error) {
            const requestError = toDeploymentRequestError(error, "We could not save this deployment.");
            notification.error({
                message: "Deployment failed",
                description: requestError.message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (deployment: IDeploymentDefinition) => {
        try {
            const updated = deployment.status.toLowerCase() === "active"
                ? await deactivateDeployment(deployment.id)
                : await activateDeployment(deployment.id);

            setDeployments((current) => upsertDeployment(current, updated));
        } catch (error) {
            const requestError = toDeploymentRequestError(error, "We could not update deployment status.");
            notification.error({
                message: "Deployment update failed",
                description: requestError.message
            });
        }
    };

    const handleCopySnippet = async (deployment: IDeploymentDefinition) => {
        if (deployment.status.toLowerCase() !== "active") {
            notification.warning({
                message: "Activate deployment first",
                description: "Only active deployments should be embedded on live sites."
            });
            return;
        }

        try {
            const existingSnippet = snippetByDeploymentId[deployment.id];
            const snippet = existingSnippet ?? (await getDeploymentSnippet(deployment.id)).snippet;

            if (!existingSnippet) {
                setSnippetByDeploymentId((current) => ({
                    ...current,
                    [deployment.id]: snippet
                }));
            }

            await navigator.clipboard.writeText(snippet);
            message.success("Install snippet copied.");
        } catch (error) {
            const requestError = toDeploymentRequestError(error, "We could not copy the install snippet.");
            notification.error({
                message: "Snippet unavailable",
                description: requestError.message
            });
        }
    };

    async function loadDeployments() {
        setIsLoadingDeployments(true);
        setDeploymentError(undefined);

        try {
            const items = await getDeployments();
            setDeployments(items);
        } catch (error) {
            const requestError = toDeploymentRequestError(error, "We could not load deployments.");
            setDeploymentError(requestError.message);
        } finally {
            setIsLoadingDeployments(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Deployments"
                description="Publish website widget deployments, manage rollout state, and copy install snippets."
                actions={
                    <Space wrap>
                        <Select
                            placeholder="Filter by bot"
                            allowClear
                            style={{ minWidth: 240 }}
                            value={selectedBotId}
                            onChange={(value) => setSelectedBotId(value)}
                            options={bots?.map((bot) => ({
                                value: bot.id,
                                label: bot.name
                            }))}
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}>
                            New Deployment
                        </Button>
                    </Space>
                }
            />

            {botsError ? (
                <Alert
                    type="error"
                    showIcon
                    message="Bots could not be loaded"
                    description={botsErrorMessage ?? "Please try again in a moment."}
                    style={{ marginBottom: 20 }}
                />
            ) : null}

            {deploymentError ? (
                <Alert
                    type="error"
                    showIcon
                    message="Deployments could not be loaded"
                    description={deploymentError}
                    style={{ marginBottom: 20 }}
                />
            ) : null}

            {selectedBot && selectedBot.status !== "published" ? (
                <Alert
                    type="warning"
                    showIcon
                    message="This bot is not published yet"
                    description={
                        <Space direction="vertical" size={8}>
                            <span>Publish the current bot from the builder before activating a widget deployment.</span>
                            <Link href={`/developer/builder/${selectedBot.id}`}>
                                <Button icon={<LinkOutlined />}>Open builder</Button>
                            </Link>
                        </Space>
                    }
                    style={{ marginBottom: 20 }}
                />
            ) : null}

            <Row gutter={[20, 20]}>
                {isLoadingDeployments || (botsPending && !bots?.length)
                    ? Array.from({ length: 3 }).map((_, index) => (
                        <Col xs={24} md={12} xl={8} key={`deployment-skeleton-${index}`}>
                            <Card className={styles.projectCard}>
                                <Skeleton active paragraph={{ rows: 5 }} />
                            </Card>
                        </Col>
                    ))
                    : filteredDeployments.map((deployment) => (
                        <Col xs={24} md={12} xl={8} key={deployment.id}>
                            <Card className={styles.projectCard}>
                                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                                    <Space align="start" style={{ justifyContent: "space-between", width: "100%" }}>
                                        <span className={styles.projectIcon}>
                                            <RocketOutlined />
                                        </span>
                                        <Tag color={deployment.status.toLowerCase() === "active" ? "green" : "default"}>
                                            {deployment.status}
                                        </Tag>
                                    </Space>

                                    <div>
                                        <Title level={4} style={{ marginBottom: 8 }}>
                                            {deployment.name}
                                        </Title>
                                        <Space direction="vertical" size={4}>
                                            <Text type="secondary">{deployment.botName}</Text>
                                            <Text type="secondary">{deployment.allowedDomains.length} allowed domain{deployment.allowedDomains.length === 1 ? "" : "s"}</Text>
                                            <Text type="secondary">
                                                Updated {new Date(deployment.updatedAt).toLocaleString()}
                                            </Text>
                                        </Space>
                                    </div>

                                    <Space wrap>
                                        <Button onClick={() => openEditDrawer(deployment)}>Edit</Button>
                                        <Button onClick={() => handleToggleStatus(deployment)}>
                                            {deployment.status.toLowerCase() === "active" ? "Deactivate" : "Activate"}
                                        </Button>
                                        <Button
                                            icon={<CopyOutlined />}
                                            onClick={() => handleCopySnippet(deployment)}
                                            disabled={deployment.status.toLowerCase() !== "active"}
                                        >
                                            Copy Snippet
                                        </Button>
                                    </Space>
                                </Space>
                            </Card>
                        </Col>
                    ))}

                {!isLoadingDeployments && filteredDeployments.length === 0 ? (
                    <Col span={24}>
                        <Card className={styles.placeholderCard}>
                            <Empty
                                description={selectedBotId
                                    ? "This bot does not have a widget deployment yet."
                                    : "No deployments yet. Create one from here or by using Deploy in the builder."}
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        </Card>
                    </Col>
                ) : null}
            </Row>

            <Drawer
                title={editingDeployment ? "Edit Deployment" : "Create Deployment"}
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                width={480}
                destroyOnHidden
                extra={
                    <Button type="primary" loading={isSubmitting} onClick={handleSubmit}>
                        {editingDeployment ? "Save Changes" : "Create Deployment"}
                    </Button>
                }
            >
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <Select
                        placeholder="Select bot"
                        value={selectedBotId}
                        onChange={(value) => setSelectedBotId(value)}
                        options={bots?.map((bot) => ({
                            value: bot.id,
                            label: `${bot.name}${bot.status !== "published" ? " (not published)" : ""}`
                        }))}
                    />

                    <Form form={form} layout="vertical">
                        <Form.Item
                            label="Deployment name"
                            name="name"
                            rules={[{ required: true, message: "Enter a deployment name." }]}
                        >
                            <Input placeholder="Production Widget" />
                        </Form.Item>

                        <Form.Item label="Allowed domains" name="allowedDomainsText">
                            <Input.TextArea
                                rows={4}
                                placeholder={"https://example.com\nhttp://localhost:3000"}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Launcher label"
                            name="launcherLabel"
                            rules={[{ required: true, message: "Enter a launcher label." }]}
                        >
                            <Input placeholder="Chat with Support Bot" />
                        </Form.Item>

                        <Form.Item
                            label="Theme color"
                            name="themeColor"
                            rules={[{ required: true, message: "Enter a theme color." }]}
                        >
                            <Input placeholder="#2563EB" />
                        </Form.Item>
                    </Form>
                </Space>
            </Drawer>
        </>
    );
}

function parseDomains(value: string): string[] {
    return value
        .split(/\r?\n|,/)
        .map((domain) => domain.trim())
        .filter((domain) => Boolean(domain));
}

function upsertDeployment(
    current: IDeploymentDefinition[],
    next: IDeploymentDefinition
): IDeploymentDefinition[] {
    const existingIndex = current.findIndex((item) => item.id === next.id);

    if (existingIndex < 0) {
        return [next, ...current];
    }

    return current.map((item) => item.id === next.id ? next : item);
}
