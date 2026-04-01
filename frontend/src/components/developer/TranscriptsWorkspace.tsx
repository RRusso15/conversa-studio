"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Card,
  Empty,
  Input,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { PageHeader } from "./PageHeader";
import { useStyles } from "./styles";
import { useBotActions, useBotState } from "@/providers/botProvider";
import {
  useTranscriptActions,
  useTranscriptState,
} from "@/providers/transcriptProvider";

const { Paragraph, Text, Title } = Typography;

export function TranscriptsWorkspace() {
  const { styles } = useStyles();
  const { bots } = useBotState();
  const { getBots } = useBotActions();
  const {
    sessions,
    totalCount,
    selectedTranscript,
    selectedTranscriptId,
    filters,
    listStatus,
    detailStatus,
    listErrorMessage,
    detailErrorMessage,
  } = useTranscriptState();
  const {
    getTranscripts,
    getTranscript,
    setTranscriptFilters,
    clearSelectedTranscript,
  } = useTranscriptActions();
  const [searchDraft, setSearchDraft] = useState(filters.searchText);
  const deferredSearch = useDeferredValue(searchDraft);

  useEffect(() => {
    void getBots();
  }, [getBots]);

  useEffect(() => {
    if (deferredSearch === filters.searchText) {
      return;
    }

    setTranscriptFilters({
      searchText: deferredSearch,
      skipCount: 0,
    });
  }, [deferredSearch, filters.searchText, setTranscriptFilters]);

  useEffect(() => {
    void getTranscripts();
  }, [filters, getTranscripts]);

  useEffect(() => {
    if (listStatus === "loading") {
      return;
    }

    if (!sessions?.length) {
      clearSelectedTranscript();
      return;
    }

    if (selectedTranscriptId && sessions.some((session) => session.id === selectedTranscriptId)) {
      return;
    }

    void getTranscript(sessions[0].id);
  }, [clearSelectedTranscript, getTranscript, listStatus, selectedTranscriptId, sessions]);

  const botOptions = useMemo(
    () =>
      bots?.map((bot) => ({
        value: bot.id,
        label: bot.name,
      })) ?? [],
    [bots]
  );

  return (
    <>
      <PageHeader
        title="Transcripts"
        description="Inspect recent conversations, follow support-relevant histories, and understand where live bots are waiting or completed."
        actions={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search token, bot, deployment, or transcript text"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              style={{ width: 320, maxWidth: "100%" }}
            />
            <Select
              allowClear
              placeholder="Filter by bot"
              value={filters.botId}
              onChange={(value) =>
                setTranscriptFilters({
                  botId: value,
                  skipCount: 0,
                })
              }
              options={botOptions}
              style={{ minWidth: 220 }}
            />
            <Select
              value={filters.status}
              onChange={(value) =>
                setTranscriptFilters({
                  status: value,
                  skipCount: 0,
                })
              }
              options={[
                { value: "all", label: "All sessions" },
                { value: "completed", label: "Completed" },
                { value: "awaiting_input", label: "Awaiting input" },
              ]}
              style={{ minWidth: 180 }}
            />
          </Space>
        }
      />

      {listErrorMessage ? (
        <Alert
          type="error"
          showIcon
          message="Transcripts could not be loaded"
          description={listErrorMessage}
          style={{ marginBottom: 20 }}
        />
      ) : null}

      <div className={styles.transcriptLayout}>
        <div className={styles.transcriptPane}>
          <div className={styles.transcriptPaneHeader}>
            <Space direction="vertical" size={4}>
              <Title level={4} style={{ margin: 0 }}>
                Sessions
              </Title>
              <Text type="secondary">
                {totalCount} conversation{totalCount === 1 ? "" : "s"} found
              </Text>
            </Space>
          </div>
          <div className={styles.transcriptPaneBody}>
            {listStatus === "loading" && !sessions?.length ? (
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={`transcript-skeleton-${index}`} className={styles.projectCard}>
                    <Skeleton active paragraph={{ rows: 3 }} />
                  </Card>
                ))}
              </Space>
            ) : null}

            {listStatus !== "loading" && !sessions?.length ? (
              <Card className={styles.placeholderCard}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    filters.botId || filters.status !== "all" || filters.searchText
                      ? "No transcripts matched the current filters."
                      : "No transcript sessions have been recorded yet."
                  }
                />
              </Card>
            ) : null}

            {sessions?.length ? (
              <div className={styles.transcriptList}>
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    className={styles.transcriptSessionCard}
                    data-selected={selectedTranscriptId === session.id}
                    onClick={() => {
                      void getTranscript(session.id);
                    }}
                  >
                    <Space
                      direction="vertical"
                      size={12}
                      style={{ width: "100%", alignItems: "stretch" }}
                    >
                      <Space
                        align="start"
                        style={{ justifyContent: "space-between", width: "100%" }}
                      >
                        <div>
                          <Text strong>{session.botName}</Text>
                          <Paragraph type="secondary" style={{ margin: 0 }}>
                            {session.deploymentName}
                          </Paragraph>
                        </div>
                        <Space wrap size={6}>
                          {session.isCompleted ? (
                            <Tag color="green">Completed</Tag>
                          ) : null}
                          {session.awaitingInput ? (
                            <Tag color="gold">Awaiting input</Tag>
                          ) : null}
                          {!session.isCompleted && !session.awaitingInput ? (
                            <Tag>Active</Tag>
                          ) : null}
                        </Space>
                      </Space>

                      <Text className={styles.transcriptSessionPreview}>
                        {session.lastMessagePreview || "No messages captured for this session yet."}
                      </Text>

                      <Space wrap size={10}>
                        <Text type="secondary">
                          {session.messageCount} message{session.messageCount === 1 ? "" : "s"}
                        </Text>
                        <Text type="secondary">
                          Updated {new Date(session.updatedAt).toLocaleString()}
                        </Text>
                      </Space>
                    </Space>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.transcriptPane}>
          <div className={styles.transcriptPaneHeader}>
            <Space direction="vertical" size={4}>
              <Title level={4} style={{ margin: 0 }}>
                Conversation
              </Title>
              <Text type="secondary">
                Review the full message history and runtime state for one session.
              </Text>
            </Space>
          </div>
          <div className={styles.transcriptPaneBody}>
            {detailErrorMessage ? (
              <Alert
                type="error"
                showIcon
                message="Transcript detail could not be loaded"
                description={detailErrorMessage}
                style={{ marginBottom: 16 }}
              />
            ) : null}

            {detailStatus === "loading" && !selectedTranscript ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : null}

            {!selectedTranscript && detailStatus !== "loading" ? (
              <Card className={styles.placeholderCard}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Select a session to inspect its transcript."
                />
              </Card>
            ) : null}

            {selectedTranscript ? (
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div className={styles.transcriptMetaGrid}>
                  <div className={styles.transcriptMetaCard}>
                    <Text strong>Bot</Text>
                    <Paragraph style={{ marginBottom: 0 }}>{selectedTranscript.botName}</Paragraph>
                    <Text type="secondary">{selectedTranscript.deploymentName}</Text>
                  </div>
                  <div className={styles.transcriptMetaCard}>
                    <Text strong>Session</Text>
                    <Paragraph style={{ marginBottom: 0 }}>{selectedTranscript.sessionToken}</Paragraph>
                    <Space wrap size={6}>
                      {selectedTranscript.isCompleted ? (
                        <Tag color="green">Completed</Tag>
                      ) : null}
                      {selectedTranscript.awaitingInput ? (
                        <Tag color="gold">Awaiting input</Tag>
                      ) : null}
                      {!selectedTranscript.isCompleted && !selectedTranscript.awaitingInput ? (
                        <Tag>Active</Tag>
                      ) : null}
                    </Space>
                  </div>
                  <div className={styles.transcriptMetaCard}>
                    <Text strong>Started</Text>
                    <Paragraph style={{ marginBottom: 0 }}>
                      {new Date(selectedTranscript.createdAt).toLocaleString()}
                    </Paragraph>
                    <Text type="secondary">
                      Updated {new Date(selectedTranscript.updatedAt).toLocaleString()}
                    </Text>
                  </div>
                  <div className={styles.transcriptMetaCard}>
                    <Text strong>Version</Text>
                    <Paragraph style={{ marginBottom: 0 }}>
                      Published v{selectedTranscript.publishedVersion}
                    </Paragraph>
                    <Text type="secondary">
                      {selectedTranscript.messageCount} message{selectedTranscript.messageCount === 1 ? "" : "s"}
                    </Text>
                  </div>
                </div>

                {selectedTranscript.messages.length === 0 ? (
                  <Card className={styles.placeholderCard}>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No transcript messages were stored for this session."
                    />
                  </Card>
                ) : (
                  <div className={styles.transcriptMessages}>
                    {selectedTranscript.messages.map((message) => {
                      const isUser = message.role.toLowerCase() === "user";

                      return (
                        <div
                          key={message.id}
                          className={`${styles.transcriptMessageRow} ${isUser ? styles.transcriptMessageRowUser : styles.transcriptMessageRowBot}`}
                        >
                          <div
                            className={`${styles.transcriptMessageBubble} ${isUser ? styles.transcriptMessageBubbleUser : styles.transcriptMessageBubbleBot}`}
                          >
                            <Text strong style={{ color: "inherit" }}>
                              {isUser ? "User" : "Bot"}
                            </Text>
                            <Paragraph style={{ color: "inherit", marginTop: 8, marginBottom: 0, whiteSpace: "pre-wrap" }}>
                              {message.content}
                            </Paragraph>
                            <Text className={styles.transcriptMessageTime} style={{ color: "inherit" }}>
                              {new Date(message.createdAt).toLocaleString()}
                            </Text>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Space>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
