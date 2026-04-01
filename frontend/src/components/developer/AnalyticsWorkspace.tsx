"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  ArrowUpOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  FireOutlined,
  MessageOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { PageHeader } from "./PageHeader";
import { InfoNotice } from "./InfoNotice";
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

  const heroHighlights = useMemo(() => {
    if (!overview || !timeseries || !breakdown) {
      return [];
    }

    const busiestDay = [...timeseries.points].sort((left, right) => right.conversationCount - left.conversationCount)[0];
    const bestPerformer = breakdown.topBots[0];
    const queuePressure = overview.awaitingInputRate >= 30;

    return [
      {
        label: "Peak day",
        value: busiestDay ? `${busiestDay.label} · ${busiestDay.conversationCount}` : "No peak yet",
      },
      {
        label: "Top bot",
        value: bestPerformer ? `${bestPerformer.name} · ${bestPerformer.conversationCount}` : "Waiting for data",
      },
      {
        label: "Flow signal",
        value: queuePressure ? "High awaiting-input share" : "Healthy completion momentum",
      },
    ];
  }, [breakdown, overview, timeseries]);

  const insightCards = useMemo(() => {
    if (!overview || !breakdown) {
      return [];
    }

    return [
      {
        title: "Outcome momentum",
        description:
          overview.completionRate >= 70
            ? "Most conversations are finishing cleanly in the selected range."
            : "A meaningful share of conversations are not finishing yet.",
        accent: "emerald" as const,
      },
      {
        title: "Reply pressure",
        description:
          overview.awaitingInputRate >= 25
            ? "Many sessions are parked waiting on the next user action."
            : "Awaiting-input sessions are staying relatively contained.",
        accent: "amber" as const,
      },
      {
        title: "Live activity",
        description:
          breakdown.activeCount > breakdown.awaitingInputCount
            ? "There is a healthy stream of currently progressing conversations."
            : "Most non-complete sessions are paused rather than actively moving.",
        accent: "slate" as const,
      },
    ];
  }, [breakdown, overview]);

  const insightToneClassMap = {
    emerald: styles.analyticsInsightCardEmerald,
    amber: styles.analyticsInsightCardAmber,
    slate: styles.analyticsInsightCardSlate,
  };

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Track conversation volume, outcome momentum, and live runtime behavior for the bots you own."
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

      <InfoNotice
        title="Analytics overview"
        description="This dashboard is powered by stored runtime sessions and transcripts. Fallback, node drop-off, and intent analytics will become richer as deeper event tracking is added."
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
          <Card className={styles.analyticsHeroCard}>
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>
          <Row gutter={[20, 20]}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Col xs={24} md={12} xl={6} key={`analytics-skeleton-${index}`}>
                <Card className={styles.statsCard}>
                  <Skeleton active paragraph={{ rows: 3 }} />
                </Card>
              </Col>
            ))}
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
          <Card className={styles.analyticsHeroCard}>
            <div className={styles.analyticsHeroGlow} />
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} xl={14}>
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <div>
                    <Text className={styles.analyticsEyebrow}>Runtime pulse</Text>
                    <Title className={styles.analyticsHeroTitle}>
                      Conversations are moving with {overview.completionRate.toFixed(1)}% completion momentum.
                    </Title>
                    <Paragraph className={styles.analyticsHeroDescription}>
                      A lively snapshot of how sessions are starting, pausing, and finishing across your live bots in the current view.
                    </Paragraph>
                  </div>

                  <div className={styles.analyticsHeroMetrics}>
                    <AnimatedMetricCard
                      title="Total conversations"
                      value={overview.totalConversations}
                      icon={<CommentOutlined />}
                      delayMs={0}
                      tone="emerald"
                    />
                    <AnimatedMetricCard
                      title="Completion rate"
                      value={overview.completionRate}
                      suffix="%"
                      precision={1}
                      icon={<BarChartOutlined />}
                      delayMs={80}
                      tone="blue"
                    />
                    <AnimatedMetricCard
                      title="Avg messages"
                      value={overview.averageMessagesPerConversation}
                      precision={1}
                      icon={<MessageOutlined />}
                      delayMs={160}
                      tone="amber"
                    />
                  </div>
                </Space>
              </Col>

              <Col xs={24} xl={10}>
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <div className={styles.analyticsLivePanel}>
                    <Space direction="vertical" size={10} style={{ width: "100%" }}>
                      <Space align="center">
                        <span className={styles.analyticsLivePulse} />
                        <Text className={styles.analyticsLiveLabel}>Live reading</Text>
                      </Space>
                      <div className={styles.analyticsLiveStatRow}>
                        <Text type="secondary">Latest activity</Text>
                        <Text strong>
                          {overview.latestConversationAt
                            ? new Date(overview.latestConversationAt).toLocaleString()
                            : "No recent activity"}
                        </Text>
                      </div>
                      <div className={styles.analyticsLiveStatRow}>
                        <Text type="secondary">Messages captured</Text>
                        <Text strong>{overview.totalMessages}</Text>
                      </div>
                      <div className={styles.analyticsLiveStatRow}>
                        <Text type="secondary">Average duration</Text>
                        <Text strong>{formatDuration(overview.averageConversationDurationSeconds)}</Text>
                      </div>
                    </Space>
                  </div>

                  <div className={styles.analyticsHighlightGrid}>
                    {heroHighlights.map((highlight) => (
                      <div key={highlight.label} className={styles.analyticsHighlightCard}>
                        <Text className={styles.analyticsHighlightLabel}>{highlight.label}</Text>
                        <Text className={styles.analyticsHighlightValue}>{highlight.value}</Text>
                      </div>
                    ))}
                  </div>
                </Space>
              </Col>
            </Row>
          </Card>

          <Row gutter={[20, 20]}>
            {[
              {
                title: "Awaiting input",
                value: overview.awaitingInputRate,
                suffix: "%",
                precision: 1,
                icon: <ClockCircleOutlined />,
                tone: "amber" as const,
              },
              {
                title: "Total messages",
                value: overview.totalMessages,
                icon: <FireOutlined />,
                tone: "pink" as const,
              },
              {
                title: "Active sessions",
                value: breakdown.activeCount,
                icon: <ThunderboltOutlined />,
                tone: "slate" as const,
              },
              {
                title: "Completion lift",
                value: Math.max(overview.completionRate - overview.awaitingInputRate, 0),
                suffix: " pts",
                precision: 1,
                icon: <ArrowUpOutlined />,
                tone: "emerald" as const,
              },
            ].map((metric, index) => (
              <Col xs={24} md={12} xl={6} key={metric.title}>
                <AnimatedMetricCard
                  title={metric.title}
                  value={metric.value}
                  suffix={metric.suffix}
                  precision={metric.precision}
                  icon={metric.icon}
                  delayMs={index * 90}
                  tone={metric.tone}
                  compact
                />
              </Col>
            ))}
          </Row>

          <Row gutter={[20, 20]}>
            <Col xs={24} xl={15}>
              <Card className={styles.analyticsPanelCard}>
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <div>
                    <Text className={styles.analyticsPanelEyebrow}>Trend focus</Text>
                    <Title level={3} style={{ marginBottom: 8, marginTop: 6 }}>
                      Conversations over time
                    </Title>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      Explore the rhythm of new sessions and spotlight standout days in the selected range.
                    </Paragraph>
                  </div>
                  <TrendBars points={timeseries.points} />
                </Space>
              </Card>
            </Col>

            <Col xs={24} xl={9}>
              <Card className={styles.analyticsPanelCard}>
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <div>
                    <Text className={styles.analyticsPanelEyebrow}>Journey insights</Text>
                    <Title level={3} style={{ marginBottom: 8, marginTop: 6 }}>
                      Session outcomes
                    </Title>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      A flow-style view of how conversations are progressing with the current data we track.
                    </Paragraph>
                  </div>

                  <JourneyRibbon
                    totalConversations={overview.totalConversations}
                    completedCount={breakdown.completedCount}
                    awaitingInputCount={breakdown.awaitingInputCount}
                    activeCount={breakdown.activeCount}
                  />

                  <div className={styles.analyticsInsightGrid}>
                    {insightCards.map((insightCard) => (
                      <div
                        key={insightCard.title}
                        className={`${styles.analyticsInsightCard} ${insightToneClassMap[insightCard.accent]}`}
                      >
                        <Text className={styles.analyticsInsightTitle}>{insightCard.title}</Text>
                        <Paragraph className={styles.analyticsInsightDescription}>
                          {insightCard.description}
                        </Paragraph>
                      </div>
                    ))}
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          <Row gutter={[20, 20]}>
            <Col xs={24} xl={12}>
              <BreakdownBoard
                title="Bot leaderboard"
                description="See which bots are driving the strongest conversation volume and where activity is clustering."
                items={breakdown.topBots}
              />
            </Col>
            <Col xs={24} xl={12}>
              <BreakdownBoard
                title="Deployment activity"
                description="Compare your busiest deployments and inspect how much of the load is active, waiting, or complete."
                items={breakdown.topDeployments}
              />
            </Col>
          </Row>
        </Space>
      ) : null}
    </>
  );
}

function AnimatedMetricCard({
  title,
  value,
  suffix,
  precision = 0,
  icon,
  delayMs,
  tone,
  compact = false,
}: {
  title: string;
  value: number;
  suffix?: string;
  precision?: number;
  icon: ReactNode;
  delayMs: number;
  tone: "emerald" | "blue" | "amber" | "pink" | "slate";
  compact?: boolean;
}) {
  const { styles } = useStyles();
  const animatedValue = useAnimatedNumber(value, precision);
  const metricToneClassMap = {
    emerald: styles.analyticsMetricCardEmerald,
    blue: styles.analyticsMetricCardBlue,
    amber: styles.analyticsMetricCardAmber,
    pink: styles.analyticsMetricCardPink,
    slate: styles.analyticsMetricCardSlate,
  };

  return (
    <div
      className={`${compact ? styles.analyticsMetricCardCompact : styles.analyticsMetricCard} ${metricToneClassMap[tone]}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className={styles.analyticsMetricHeader}>
        <span className={styles.analyticsMetricIcon}>{icon}</span>
        <Text className={styles.analyticsMetricTitle}>{title}</Text>
      </div>
      <Text className={styles.analyticsMetricValue}>
        {formatAnimatedValue(animatedValue, precision)}
        {suffix ? <span className={styles.analyticsMetricSuffix}>{suffix}</span> : null}
      </Text>
    </div>
  );
}

function TrendBars({ points }: { points: Array<{ date: string; label: string; conversationCount: number }> }) {
  const { styles } = useStyles();
  const [activePointIndex, setActivePointIndex] = useState(Math.max(points.length - 1, 0));

  if (!points.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No trend data is available for the current range."
      />
    );
  }

  const maxCount = Math.max(...points.map((point) => point.conversationCount), 1);
  const resolvedActivePointIndex = activePointIndex < points.length ? activePointIndex : Math.max(points.length - 1, 0);
  const activePoint = points[resolvedActivePointIndex] ?? points[points.length - 1];
  const previousPoint = points[Math.max(resolvedActivePointIndex - 1, 0)];
  const delta = activePoint.conversationCount - (previousPoint?.conversationCount ?? 0);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div className={styles.analyticsTrendSpotlight}>
        <div>
          <Text className={styles.analyticsSpotlightLabel}>Selected day</Text>
          <Title level={2} style={{ margin: "6px 0 4px" }}>
            {activePoint.label}
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {activePoint.conversationCount} conversation{activePoint.conversationCount === 1 ? "" : "s"} started.
          </Paragraph>
        </div>
        <div className={styles.analyticsSpotlightDelta}>
          <Text className={styles.analyticsSpotlightDeltaLabel}>Change vs previous</Text>
          <Text className={styles.analyticsSpotlightDeltaValue}>
            {delta >= 0 ? "+" : ""}
            {delta}
          </Text>
        </div>
      </div>

      <div className={styles.analyticsTrendScroller}>
        <div className={styles.analyticsTrendBars}>
          {points.map((point, index) => {
            const height = Math.max(12, Math.round((point.conversationCount / maxCount) * 100));
            const isActive = index === resolvedActivePointIndex;

            return (
              <button
                key={`${point.date}-${point.label}`}
                type="button"
                className={styles.analyticsTrendBarButton}
                onMouseEnter={() => setActivePointIndex(index)}
                onFocus={() => setActivePointIndex(index)}
                onClick={() => setActivePointIndex(index)}
                data-active={isActive}
              >
                <div className={styles.analyticsTrendBarColumn}>
                  <Text className={styles.analyticsTrendValue}>{point.conversationCount}</Text>
                  <div className={styles.analyticsTrendBarTrack}>
                    <div
                      className={styles.analyticsTrendBarFill}
                      style={{ height: `${height}%`, animationDelay: `${index * 60}ms` }}
                      title={`${point.label}: ${point.conversationCount} conversations`}
                    />
                  </div>
                  <Text className={styles.analyticsTrendLabel}>{point.label}</Text>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Space>
  );
}

function JourneyRibbon({
  totalConversations,
  completedCount,
  awaitingInputCount,
  activeCount,
}: {
  totalConversations: number;
  completedCount: number;
  awaitingInputCount: number;
  activeCount: number;
}) {
  const { styles } = useStyles();
  const [activeStage, setActiveStage] = useState("completed");

  const stageItems = [
    {
      key: "started",
      label: "Started",
      count: totalConversations,
      tone: "slate" as const,
      description: "Every conversation counted in this filtered view.",
    },
    {
      key: "completed",
      label: "Completed",
      count: completedCount,
      tone: "emerald" as const,
      description: "Sessions that reached a completed runtime state.",
    },
    {
      key: "awaiting",
      label: "Awaiting input",
      count: awaitingInputCount,
      tone: "amber" as const,
      description: "Sessions parked while waiting for the next user reply.",
    },
    {
      key: "active",
      label: "Still active",
      count: activeCount,
      tone: "blue" as const,
      description: "Sessions progressing without being complete or paused.",
    },
  ];

  const activeItem = stageItems.find((stageItem) => stageItem.key === activeStage) ?? stageItems[0];
  const journeyToneClassMap = {
    slate: styles.analyticsJourneyStepSlate,
    emerald: styles.analyticsJourneyStepEmerald,
    amber: styles.analyticsJourneyStepAmber,
    blue: styles.analyticsJourneyStepBlue,
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <div className={styles.analyticsJourneyRibbon}>
        {stageItems.map((stageItem) => (
          <button
            key={stageItem.key}
            type="button"
            className={`${styles.analyticsJourneyStep} ${journeyToneClassMap[stageItem.tone]}`}
            data-active={activeStage === stageItem.key}
            onMouseEnter={() => setActiveStage(stageItem.key)}
            onFocus={() => setActiveStage(stageItem.key)}
            onClick={() => setActiveStage(stageItem.key)}
          >
            <Text className={styles.analyticsJourneyStepLabel}>{stageItem.label}</Text>
            <Text className={styles.analyticsJourneyStepValue}>{stageItem.count}</Text>
            <Progress
              percent={Number(formatPercentage(stageItem.count, totalConversations))}
              showInfo={false}
              size="small"
              strokeColor="currentColor"
              trailColor="rgba(255,255,255,0.18)"
            />
          </button>
        ))}
      </div>

      <div className={styles.analyticsJourneyCallout}>
        <Text className={styles.analyticsJourneyCalloutEyebrow}>Current focus</Text>
        <Text className={styles.analyticsJourneyCalloutTitle}>
          {activeItem.label} accounts for {formatPercentage(activeItem.count, totalConversations)}% of observed sessions.
        </Text>
        <Paragraph className={styles.analyticsJourneyCalloutDescription}>
          {activeItem.description}
        </Paragraph>
      </div>
    </Space>
  );
}

function BreakdownBoard({
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
  const { styles } = useStyles();
  const [activeItemId, setActiveItemId] = useState(items[0]?.id);

  const activeItem = items.find((item) => item.id === activeItemId) ?? items[0];

  return (
    <Card className={styles.analyticsPanelCard}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Text className={styles.analyticsPanelEyebrow}>Leaderboard</Text>
          <Title level={3} style={{ marginBottom: 8, marginTop: 6 }}>
            {title}
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {description}
          </Paragraph>
        </div>

        <div className={styles.analyticsBoardList}>
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={styles.analyticsBoardItem}
              data-active={item.id === activeItem?.id}
              onMouseEnter={() => setActiveItemId(item.id)}
              onFocus={() => setActiveItemId(item.id)}
              onClick={() => setActiveItemId(item.id)}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className={styles.analyticsBoardItemRank}>{index + 1}</div>
              <div className={styles.analyticsBoardItemContent}>
                <Space style={{ justifyContent: "space-between", width: "100%" }}>
                  <Text strong>{item.name}</Text>
                  <Text className={styles.analyticsBoardItemValue}>
                    {item.conversationCount}
                  </Text>
                </Space>
                <Progress
                  percent={Number(formatPercentage(item.conversationCount, activeItem?.conversationCount ?? item.conversationCount))}
                  showInfo={false}
                  size="small"
                  strokeColor="#0f766e"
                />
              </div>
            </button>
          ))}
        </div>

        {activeItem ? (
          <div className={styles.analyticsBoardDetail}>
            <Text className={styles.analyticsBoardDetailTitle}>{activeItem.name}</Text>
            <Space wrap size={10}>
              <Tag>{activeItem.totalMessageCount} messages</Tag>
              <Tag color="green">{activeItem.completedConversationCount} completed</Tag>
              <Tag color="gold">{activeItem.awaitingInputConversationCount} awaiting</Tag>
              <Tag color="blue">{activeItem.activeConversationCount} active</Tag>
            </Space>
          </div>
        ) : null}
      </Space>
    </Card>
  );
}

function useAnimatedNumber(target: number, precision: number) {
  const [animatedValue, setAnimatedValue] = useState(target);
  const valueRef = useRef(target);

  useEffect(() => {
    valueRef.current = animatedValue;
  }, [animatedValue]);

  useEffect(() => {
    let animationFrame = 0;
    let startTime = 0;
    const durationMs = 800;
    const startingValue = valueRef.current;

    const animate = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = startingValue + (target - startingValue) * easedProgress;
      setAnimatedValue(Number(nextValue.toFixed(precision + 1)));

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [precision, target]);

  return animatedValue;
}

function formatAnimatedValue(value: number, precision: number): string {
  if (precision > 0) {
    return value.toFixed(precision);
  }

  return Math.round(value).toString();
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
