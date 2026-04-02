"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DeleteOutlined,
  EyeOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { Alert, App, Button, Card, Col, Empty, Popconfirm, Row, Skeleton, Space, Tag, Typography } from "antd";
import { NewBotLauncherButton } from "./NewBotLauncherButton";
import { PageHeader } from "./PageHeader";
import { useStyles } from "./styles";
import { useBotActions, useBotState } from "@/providers/botProvider";

const { Paragraph, Text, Title } = Typography;

export function ProjectsWorkspace() {
  const router = useRouter();
  const { styles } = useStyles();
  const { notification } = App.useApp();
  const { bots, isPending, isError, errorMessage, deleteStatus } = useBotState();
  const { getBots, deleteBot } = useBotActions();
  const [deletingBotId, setDeletingBotId] = useState<string>();

  useEffect(() => {
    void getBots();
  }, [getBots]);

  const handleDeleteBot = async (botId: string, botName: string): Promise<void> => {
    setDeletingBotId(botId);
    const result = await deleteBot(botId);
    setDeletingBotId(undefined);

    if (result.error) {
      notification.error({
        message: "Bot could not be deleted",
        description: result.error.message,
      });
      return;
    }

    notification.success({
      message: "Bot deleted",
      description: `${botName} and its related runtime history were removed.`,
    });
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description="Manage active bots, return to drafts, and start new build flows from one place."
        actions={
          <NewBotLauncherButton />
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
            <Card
              className={styles.projectCard}
              onClick={() => {
                router.push(`/developer/builder/${bot.id}`);
              }}
            >
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

                  <Popconfirm
                    title="Delete this bot?"
                    description="This removes the bot, its deployments, sessions, and transcript history."
                    okText="Delete bot"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true, loading: deletingBotId === bot.id && deleteStatus === "deleting" }}
                    onConfirm={(event) => {
                      event?.stopPropagation();
                      return handleDeleteBot(bot.id, bot.name);
                    }}
                  >
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      loading={deletingBotId === bot.id && deleteStatus === "deleting"}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                    >
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>

                <div>
                  <Title level={4} style={{ marginBottom: 8 }}>
                    {bot.name}
                  </Title>
                  <Space wrap size={10}>
                    <Tag color={bot.status === "published" ? "green" : "default"}>
                      {bot.status === "published" ? "Published" : "Draft"}
                    </Tag>
                    {bot.status === "published" && bot.hasUnpublishedChanges ? (
                      <Tag color="gold">Unpublished changes</Tag>
                    ) : null}
                    <Text type="secondary">
                      Edited {new Date(bot.updatedAt).toLocaleString()}
                    </Text>
                  </Space>
                </div>

                <div className={styles.projectFooter}>
                  <Space
                    align="center"
                    style={{ justifyContent: "space-between", width: "100%" }}
                  >
                    <Text type="secondary">
                      Open the builder to continue editing this bot draft.
                    </Text>
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        router.push(`/developer/builder/${bot.id}`);
                      }}
                    >
                      Open builder
                    </Button>
                  </Space>
                </div>
              </Space>
            </Card>
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
            <Card className={styles.createCard}>
              <Space direction="vertical" size="small">
                <span className={styles.createIcon}>
                  <MessageOutlined />
                </span>
                <Title level={4} style={{ marginBottom: 0 }}>
                  Create new bot
                </Title>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Start from a blank canvas, choose a template, or generate a draft from a prompt.
                </Paragraph>
                <NewBotLauncherButton type="link" label="Choose a starting point" />
              </Space>
            </Card>
        </Col>
      </Row>
    </>
  );
}
