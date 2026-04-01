"use client";

import { useEffect, useMemo } from "react";
import {
  Alert,
  Card,
  Col,
  Empty,
  List,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { BarChartOutlined, ClockCircleOutlined, CommentOutlined, MessageOutlined } from "@ant-design/icons";
import { PageHeader } from "./PageHeader";
import { useStyles } from "./styles";
import { useBotActions, useBotState } from "@/providers/botProvider";
import {
  ANALYTICS_DATE_RANGE_OPTIONS,
  useAnalyticsActions,
  useAnalyticsState,
} from "@/providers/analyticsProvider";

const { Paragraph, Text, Title } = Typography;

export function AnalyticsWorkspace() {
  const { styles } = useStyles();
  const { bots } = useBotState();
  const { getBots } = useBotActions();
  const { overview, timeseries, breakdown, filters, status, errorMessage } = useAnalyticsState();
  const { getAnalytics, setAnalyticsFilters } = useAnalyticsActions();

  useEffect(() => {
    void getBots();
  }, [getBots]);

  useEffect(() => {
    void getAnalytics();
  }, [filters, getAnalytics]);

  const botOptions = useMemo(
    () =>
      bots?.map((bot) => ({
        value: bot.id,
        label: bot.name,
      })) ?? [],
    [bots]
  );

  const hasConversationData = (overview?.totalConversations ?? 0) > 0;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Track conversation volume, outcomes, and recent runtime trends for the bots you own."
        actions={
          <Space wrap>
            <Select
              value={filters.dateRange}
              onChange={(value) =>
                setAnalyticsFilters({
                  dateRange: value,
                })
              }
              options={ANALYTICS_DATE_RANGE_OPTIONS}
              style={{ minWidth: 180 }}
            />
            <Select
              allowClear
              placeholder="Filter by bot"
              value={filters.botId}
              onChange={(value) =>
                setAnalyticsFilters({
                  botId: value,
                })
              }
              options={botOptions}
              style={{ minWidth: 220 }}
            />
          </Space>
        }
      />

      <Alert
        type="info"
        showIcon
        message="Analytics MVP"
        description="This dashboard uses stored runtime sessions and transcripts. Fallback, node drop-off, and intent analytics are not yet tracked explicitly."
        style={{ marginBottom: 20 }}
      />

      {errorMessage ? (
        <Alert
          type="error"
          showIcon
          message="Analytics could not be loaded"
          description={errorMessage}
          style={{ marginBottom: 20 }}
        />
      ) : null}

      {status === "loading" && !overview ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row gutter={[20, 20]}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Col xs={24} sm={12} xl={8} xxl={4} key={`analytics-stat-skeleton-${index}`}>
                <Card className={styles.statsCard}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              </Col>
            ))}
          </Row>
          <Row gutter={[20, 20]}>
            <Col xs={24} xl={16}>
              <Card className={styles.placeholderCard}>
                <Skeleton active paragraph={{ rows: 8 }} />
              </Card>
            </Col>
            <Col xs={24} xl={8}>
              <Card className={styles.placeholderCard}>
                <Skeleton active paragraph={{ rows: 8 }} />
              </Card>
            </Col>
          </Row>
        </Space>
      ) : null}

      {status !== "loading" && !hasConversationData ? (
        <Card className={styles.placeholderCard}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No conversations were found for the selected bot and date range."
          />
        </Card>
      ) : null}

      {overview && breakdown && timeseries && hasConversationData ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} xl={8} xxl={4}>
              <Card className={styles.statsCard}>
                <Statistic
                  title="Total conversations"
                  value={overview.totalConversations}
                  prefix={<CommentOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={8} xxl={4}>
              <Card className={styles.statsCard}>
                <Statistic
                  title="Completion rate"
                  value={overview.completionRate}
                  suffix="%"
                  precision={1}
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={8} xxl={4}>
              <Card className={styles.statsCard}>
                <Statistic
                  title="Awaiting input rate"
                  value={overview.awaitingInputRate}
                  suffix="%"
                  precision={1}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={8} xxl={4}>
              <Card className={styles.statsCard}>
                <Statistic
                  title="Avg messages / conversation"
                  value={overview.averageMessagesPerConversation}
                  precision={1}
                  prefix={<MessageOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={8} xxl={4}>
              <Card className={styles.statsCard}>
                <Statistic
                  title="Avg duration"
                  value={formatDuration(overview.averageConversationDurationSeconds)}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={8} xxl={4}>
              <Card className={styles.statsCard}>
                <Statistic
                  title="Total messages"
                  value={overview.totalMessages}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[20, 20]}>
            <Col xs={24} xl={16}>
              <Card className={styles.placeholderCard}>
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <div>
                    <Title level={4} style={{ marginBottom: 8 }}>
                      Conversations over time
                    </Title>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      Daily conversation starts for the current filter window.
                    </Paragraph>
                  </div>
                  <TrendBars points={timeseries.points} />
                </Space>
              </Card>
            </Col>

            <Col xs={24} xl={8}>
              <Card className={styles.placeholderCard}>
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <div>
                    <Title level={4} style={{ marginBottom: 8 }}>
                      Status distribution
                    </Title>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      A quick read on which sessions are done, waiting, or still active.
                    </Paragraph>
                  </div>

                  <StatusDistribution
                    completedCount={breakdown.completedCount}
                    awaitingInputCount={breakdown.awaitingInputCount}
                    activeCount={breakdown.activeCount}
                    totalConversations={overview.totalConversations}
                  />

                  <div className={styles.analyticsMetaCard}>
                    <Text strong>Latest activity</Text>
                    <Paragraph style={{ marginBottom: 4, marginTop: 8 }}>
                      {overview.latestConversationAt
                        ? new Date(overview.latestConversationAt).toLocaleString()
                        : "No recent activity"}
                    </Paragraph>
                    <Text type="secondary">
                      {overview.totalMessages} total transcript message{overview.totalMessages === 1 ? "" : "s"} in this range
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          <Row gutter={[20, 20]}>
            <Col xs={24} xl={12}>
              <Card className={styles.placeholderCard}>
                <BreakdownList
                  title="Top bots"
                  description="Bots with the most conversations in the selected range."
                  items={breakdown.topBots}
                />
              </Card>
            </Col>
            <Col xs={24} xl={12}>
              <Card className={styles.placeholderCard}>
                <BreakdownList
                  title="Top deployments"
                  description="Deployments generating the most conversation volume."
                  items={breakdown.topDeployments}
                />
              </Card>
            </Col>
          </Row>
        </Space>
      ) : null}
    </>
  );
}

function TrendBars({ points }: { points: Array<{ date: string; label: string; conversationCount: number }> }) {
  const { styles } = useStyles();

  if (!points.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No trend data is available for the current range."
      />
    );
  }

  const maxCount = Math.max(...points.map((point) => point.conversationCount), 1);

  return (
    <div className={styles.analyticsTrendScroller}>
      <div className={styles.analyticsTrendBars}>
        {points.map((point) => {
          const height = Math.max(12, Math.round((point.conversationCount / maxCount) * 100));

          return (
            <div key={`${point.date}-${point.label}`} className={styles.analyticsTrendBarColumn}>
              <Text className={styles.analyticsTrendValue}>{point.conversationCount}</Text>
              <div className={styles.analyticsTrendBarTrack}>
                <div
                  className={styles.analyticsTrendBarFill}
                  style={{ height: `${height}%` }}
                  title={`${point.label}: ${point.conversationCount} conversations`}
                />
              </div>
              <Text className={styles.analyticsTrendLabel}>{point.label}</Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusDistribution({
  completedCount,
  awaitingInputCount,
  activeCount,
  totalConversations,
}: {
  completedCount: number;
  awaitingInputCount: number;
  activeCount: number;
  totalConversations: number;
}) {
  const statusItems = [
    { label: "Completed", count: completedCount, color: "#16a34a" },
    { label: "Awaiting input", count: awaitingInputCount, color: "#d97706" },
    { label: "Active", count: activeCount, color: "#111827" },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {statusItems.map((statusItem) => (
        <div key={statusItem.label}>
          <Space style={{ justifyContent: "space-between", width: "100%" }}>
            <Text strong>{statusItem.label}</Text>
            <Text type="secondary">
              {statusItem.count} ({formatPercentage(statusItem.count, totalConversations)}%)
            </Text>
          </Space>
          <Progress
            percent={Number(formatPercentage(statusItem.count, totalConversations))}
            strokeColor={statusItem.color}
            showInfo={false}
            size="small"
          />
        </div>
      ))}
    </Space>
  );
}

function BreakdownList({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{
    id: string;
    name: string;
    conversationCount: number;
    completedConversationCount: number;
    awaitingInputConversationCount: number;
    activeConversationCount: number;
    totalMessageCount: number;
  }>;
}) {
  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Title level={4} style={{ marginBottom: 8 }}>
          {title}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {description}
        </Paragraph>
      </div>

      <List
        dataSource={items}
        locale={{ emptyText: "No analytics data is available here yet." }}
        renderItem={(item) => (
          <List.Item key={item.id}>
            <List.Item.Meta
              title={
                <Space wrap>
                  <Text strong>{item.name}</Text>
                  <Tag>{item.conversationCount} conversations</Tag>
                </Space>
              }
              description={
                <Space wrap size={8}>
                  <Text type="secondary">{item.totalMessageCount} messages</Text>
                  <Text type="secondary">{item.completedConversationCount} completed</Text>
                  <Text type="secondary">{item.awaitingInputConversationCount} awaiting</Text>
                  <Text type="secondary">{item.activeConversationCount} active</Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Space>
  );
}

function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "0s";
  }

  const roundedSeconds = Math.round(totalSeconds);
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const seconds = roundedSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function formatPercentage(count: number, total: number): string {
  if (total <= 0) {
    return "0.0";
  }

  return ((count / total) * 100).toFixed(1);
}
