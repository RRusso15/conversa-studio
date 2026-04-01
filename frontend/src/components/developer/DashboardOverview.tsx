"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightOutlined,
  BarChartOutlined,
  MessageOutlined,
  PlusOutlined,
  RocketOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Col, List, Row, Skeleton, Space, Statistic, Tag, Typography } from "antd";
import { PageHeader } from "./PageHeader";
import { useStyles } from "./styles";
import { useBotActions, useBotState } from "@/providers/botProvider";
import { getAnalyticsOverview, type IAnalyticsOverview } from "@/utils/analytics-api";
import { getDeployments, toDeploymentRequestError, type IDeploymentDefinition } from "@/utils/deployment-api";

const { Paragraph, Text, Title } = Typography;

export function DashboardOverview() {
  const { styles } = useStyles();
  const { bots, isPending: botsPending, isError: botsError, errorMessage: botsErrorMessage } = useBotState();
  const { getBots } = useBotActions();
  const [analyticsOverview, setAnalyticsOverview] = useState<IAnalyticsOverview>();
  const [deployments, setDeployments] = useState<IDeploymentDefinition[]>([]);
  const [isLoadingWorkspaceStats, setIsLoadingWorkspaceStats] = useState(true);
  const [workspaceErrorMessage, setWorkspaceErrorMessage] = useState<string>();

  useEffect(() => {
    void getBots();
  }, [getBots]);

  useEffect(() => {
    void loadWorkspaceStats();
  }, []);

  const activeDeploymentCount = useMemo(
    () => deployments.filter((deployment) => deployment.status.toLowerCase() === "active").length,
    [deployments]
  );

  const recentBots = useMemo(
    () =>
      [...(bots ?? [])]
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
        .slice(0, 4),
    [bots]
  );

  const metrics = useMemo(
    () => [
      {
        title: "Bots in workspace",
        value: bots?.length ?? 0,
        prefix: <ThunderboltOutlined />
      },
      {
        title: "Active deployments",
        value: activeDeploymentCount,
        prefix: <RocketOutlined />
      },
      {
        title: "Monthly conversations",
        value: analyticsOverview?.totalConversations ?? 0,
        prefix: <MessageOutlined />
      },
      {
        title: "Completion rate",
        value: analyticsOverview?.completionRate ?? 0,
        suffix: "%",
        precision: 1,
        prefix: <BarChartOutlined />
      },
    ],
    [activeDeploymentCount, analyticsOverview?.completionRate, analyticsOverview?.totalConversations, bots?.length]
  );

  return (
    <>
      <PageHeader
        title="Developer Dashboard"
        description="Keep an eye on your workspace, resume recent bots, and jump back into creation quickly."
        actions={
          <Link href="/developer/builder/new">
            <Button type="primary" icon={<PlusOutlined />}>
              New Bot
            </Button>
          </Link>
        }
      />

      {botsError ? (
        <Alert
          type="error"
          showIcon
          message="Bots could not be loaded"
          description={botsErrorMessage ?? "Please refresh and try again."}
          style={{ marginBottom: 20 }}
        />
      ) : null}

      {workspaceErrorMessage ? (
        <Alert
          type="error"
          showIcon
          message="Workspace metrics could not be loaded"
          description={workspaceErrorMessage}
          style={{ marginBottom: 20 }}
        />
      ) : null}

      <Row gutter={[20, 20]}>
        {isLoadingWorkspaceStats && !analyticsOverview && !(bots?.length ?? 0)
          ? Array.from({ length: 4 }).map((_, index) => (
              <Col xs={24} sm={12} xl={6} key={`dashboard-metric-skeleton-${index}`}>
                <Card className={styles.statsCard}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              </Col>
            ))
          : metrics.map((metric) => (
              <Col xs={24} sm={12} xl={6} key={metric.title}>
                <Card className={styles.statsCard}>
                  <Statistic {...metric} />
                </Card>
              </Col>
            ))}
      </Row>

      <Row gutter={[20, 20]} style={{ marginTop: 8 }}>
        <Col xs={24} xl={14}>
          <Card className={styles.placeholderCard}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <div>
                <Tag color="green">Workspace Focus</Tag>
                <Title level={3} style={{ marginTop: 12, marginBottom: 8 }}>
                  Strong builder support comes first
                </Title>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Your workspace currently has {bots?.length ?? 0} bot{(bots?.length ?? 0) === 1 ? "" : "s"}, {activeDeploymentCount} active deployment{activeDeploymentCount === 1 ? "" : "s"}, and{" "}
                  {analyticsOverview?.totalConversations ?? 0} tracked conversation{(analyticsOverview?.totalConversations ?? 0) === 1 ? "" : "s"} in the last 30 days.
                </Paragraph>
              </div>

              <Space wrap>
                <Link href="/developer/projects">
                  <Button type="primary">View Projects</Button>
                </Link>
                <Link href="/developer/analytics">
                  <Button>Open Analytics</Button>
                </Link>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card className={styles.placeholderCard}>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Title level={4} style={{ margin: 0 }}>
                Recent bots
              </Title>
              {botsPending && !recentBots.length ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : (
                <List
                  dataSource={recentBots}
                  locale={{ emptyText: "No bots have been created yet." }}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Link
                          href={`/developer/builder/${encodeURIComponent(item.id)}`}
                          key={`${item.id}-open`}
                        >
                          Open
                        </Link>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text strong>{item.name}</Text>
                            <Tag color={item.status === "published" ? "green" : "default"}>
                              {item.status === "published" ? "Published" : "Draft"}
                            </Tag>
                          </Space>
                        }
                        description={`Updated ${formatRelativeDate(item.updatedAt)}`}
                      />
                    </List.Item>
                  )}
                />
              )}

              <Link href="/developer/projects">
                <Button type="link" icon={<ArrowRightOutlined />} style={{ paddingInline: 0 }}>
                  Go to full project list
                </Button>
              </Link>
            </Space>
          </Card>
        </Col>
      </Row>
    </>
  );

  async function loadWorkspaceStats() {
    setIsLoadingWorkspaceStats(true);
    setWorkspaceErrorMessage(undefined);

    try {
      const [overview, deploymentItems] = await Promise.all([
        getAnalyticsOverview({ dateRange: "30d" }),
        getDeployments()
      ]);

      setAnalyticsOverview(overview);
      setDeployments(deploymentItems);
    } catch (error) {
      const requestError = toDeploymentRequestError(error, "We could not load workspace metrics.");
      setWorkspaceErrorMessage(requestError.message);
    } finally {
      setIsLoadingWorkspaceStats(false);
    }
  }
}

function formatRelativeDate(value: string): string {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "recently";
  }

  const deltaMs = Date.now() - timestamp;
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (deltaMs < minuteMs) {
    return "just now";
  }

  if (deltaMs < hourMs) {
    const minutes = Math.max(1, Math.round(deltaMs / minuteMs));
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (deltaMs < dayMs) {
    const hours = Math.max(1, Math.round(deltaMs / hourMs));
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  if (deltaMs < 7 * dayMs) {
    const days = Math.max(1, Math.round(deltaMs / dayMs));
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return new Date(value).toLocaleDateString();
}
