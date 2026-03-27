"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  EyeOutlined,
  MessageOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Col, Empty, Row, Skeleton, Space, Tag, Typography } from "antd";
import { PageHeader } from "./PageHeader";
import { useStyles } from "./styles";
import { useBotActions, useBotState } from "@/providers/botProvider";

const { Paragraph, Text, Title } = Typography;

export function ProjectsWorkspace() {
  const { styles } = useStyles();
  const { bots, isPending, isError, errorMessage } = useBotState();
  const { getBots } = useBotActions();

  useEffect(() => {
    void getBots();
  }, [getBots]);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Manage active bots, return to drafts, and start new build flows from one place."
        actions={
          <Link href="/developer/builder/new">
            <Button type="primary" icon={<PlusOutlined />}>
              New Bot
            </Button>
          </Link>
        }
      />

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="Bots could not be loaded"
          description={errorMessage ?? "Please try again in a moment."}
          style={{ marginBottom: 20 }}
        />
      ) : null}

      <Row gutter={[20, 20]}>
        {isPending && !bots?.length
          ? Array.from({ length: 3 }).map((_, index) => (
              <Col xs={24} md={12} xl={8} key={`skeleton-${index}`}>
                <Card className={styles.projectCard}>
                  <Skeleton active paragraph={{ rows: 4 }} />
                </Card>
              </Col>
            ))
          : null}

        {bots?.map((bot) => (
          <Col xs={24} md={12} xl={8} key={bot.id}>
            <Link href={`/developer/builder/${bot.id}`}>
              <Card className={styles.projectCard}>
                <Space
                  direction="vertical"
                  size="large"
                  style={{
                    width: "100%",
                    minHeight: 220,
                    justifyContent: "space-between",
                  }}
                >
                  <Space
                    align="start"
                    style={{ justifyContent: "space-between", width: "100%" }}
                  >
                    <span className={styles.projectIcon}>
                      <MessageOutlined />
                    </span>
                  </Space>

                  <div>
                    <Title level={4} style={{ marginBottom: 8 }}>
                      {bot.name}
                    </Title>
                    <Space wrap size={10}>
                      <Tag color={bot.status === "published" ? "green" : "default"}>
                        {bot.status === "published" ? "Published" : "Draft"}
                      </Tag>
                      <Text type="secondary">
                        Edited {new Date(bot.updatedAt).toLocaleString()}
                      </Text>
                    </Space>
                  </div>

                  <div className={styles.projectFooter}>
                    <Text type="secondary">
                      Open the builder to continue editing this bot draft.
                    </Text>
                  </div>
                </Space>
              </Card>
            </Link>
          </Col>
        ))}

        {!isPending && !bots?.length ? (
          <Col span={24}>
            <Card className={styles.placeholderCard}>
              <Empty
                description="You do not have any bots yet. Create a new bot to enter the builder."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          </Col>
        ) : null}

        <Col xs={24} md={12} xl={8}>
          <Link href="/developer/builder/new">
            <Card className={styles.createCard}>
              <Space direction="vertical" size="small">
                <span className={styles.createIcon}>
                  <PlusOutlined />
                </span>
                <Title level={4} style={{ marginBottom: 0 }}>
                  Create new bot
                </Title>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Start from scratch or enter the builder from a blank canvas.
                </Paragraph>
                <Button type="link" icon={<EyeOutlined />}>
                  Open builder
                </Button>
              </Space>
            </Card>
          </Link>
        </Col>
      </Row>
    </>
  );
}
