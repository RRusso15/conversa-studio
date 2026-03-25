"use client";

"use client";

import Link from "next/link";
import {
  ArrowRightOutlined,
  BarChartOutlined,
  MessageOutlined,
  PlusOutlined,
  RocketOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, List, Row, Space, Statistic, Tag, Typography } from "antd";
import { PageHeader } from "./PageHeader";
import { useStyles } from "./styles";

const { Paragraph, Text, Title } = Typography;

const metrics = [
  { title: "Bots in workspace", value: 12, prefix: <ThunderboltOutlined /> },
  { title: "Active deployments", value: 4, prefix: <RocketOutlined /> },
  { title: "Monthly conversations", value: 18542, prefix: <MessageOutlined /> },
  { title: "Fallback rate", value: 12.4, suffix: "%", prefix: <BarChartOutlined /> },
];

const recentProjects = [
  { name: "Customer Support Bot", status: "Active", updated: "2 hours ago" },
  { name: "Lead Qualification Bot", status: "Draft", updated: "Yesterday" },
  { name: "Internal IT Helpdesk", status: "Active", updated: "3 days ago" },
];

export function DashboardOverview() {
  const { styles } = useStyles();

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

      <Row gutter={[20, 20]}>
        {metrics.map((metric) => (
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
                  The MVP is anchored around bot definitions, builder flow, and
                  deployable runtime behavior. This dashboard exists to orient
                  the developer, not to distract from the core build loop.
                </Paragraph>
              </div>

              <Space wrap>
                <Link href="/developer/projects">
                  <Button type="primary">View Projects</Button>
                </Link>
                <Link href="/developer/templates">
                  <Button>Browse Templates</Button>
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
              <List
                dataSource={recentProjects}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Link
                        href={`/developer/builder/${encodeURIComponent(item.name.toLowerCase().replace(/\s+/g, "-"))}`}
                        key={`${item.name}-open`}
                      >
                        Open
                      </Link>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{item.name}</Text>
                          <Tag color={item.status === "Active" ? "green" : "default"}>
                            {item.status}
                          </Tag>
                        </Space>
                      }
                      description={`Updated ${item.updated}`}
                    />
                  </List.Item>
                )}
              />

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
}
