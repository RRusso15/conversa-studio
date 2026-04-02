"use client";

import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Input, Modal, Space, Tag, Typography } from "antd";
import { useState } from "react";
import { useBuilder } from "./builder-context";
import { nodePalette } from "./node-registry";
import { useBuilderStyles } from "./styles";
import type { HandoffInboxConfig } from "./types";

const { Paragraph, Title } = Typography;

export function NodePalette() {
  const { styles } = useBuilderStyles();
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);
  const { addNode, updateBotMetadata, state } = useBuilder();
  const handoffInboxes = state.graph.metadata.handoffInboxes ?? [];

  const updateHandoffInboxes = (nextInboxes: HandoffInboxConfig[]) => {
    updateBotMetadata({ handoffInboxes: nextInboxes });
  };

  return (
    <>
      <Card bordered={false} className={styles.panelCard}>
        <div className={styles.paletteLayout}>
          <div className={styles.paletteContent}>
            <Title level={5}>Nodes</Title>
            <Paragraph type="secondary">
              Click/Drag to add a node.
            </Paragraph>

            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              {nodePalette.map((node) => (
                <Button
                  key={node.type}
                  className={styles.paletteButton}
                  size="large"
                  icon={node.icon}
                  onClick={() => addNode(node.type)}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/conversa-node", node.type);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                >
                  <span>{node.label}</span>
                </Button>
              ))}
            </Space>
          </div>

          <div className={styles.paletteFooter}>
            <Button
              block
              className={styles.paletteUtilityButton}
              onClick={() => setIsInboxModalOpen(true)}
            >
              Configure Inboxes
            </Button>
            <Tag className={styles.polishedPanelTag}>
              {handoffInboxes.length} handoff inbox{handoffInboxes.length === 1 ? "" : "es"}
            </Tag>
          </div>
        </div>
      </Card>

      <Modal
        centered
        open={isInboxModalOpen}
        onCancel={() => setIsInboxModalOpen(false)}
        footer={null}
        title="Configure Handoff Inboxes"
        width={760}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Alert
            type="info"
            showIcon
            message="Handoff nodes can use any inbox configured here."
          />

          {handoffInboxes.length === 0 ? (
            <Alert
              type="warning"
              showIcon
              message="No handoff inboxes configured"
              description="Add at least one inbox before using the handoff node in a live bot."
            />
          ) : null}

          {handoffInboxes.map((inbox, index) => (
            <div key={`${inbox.key}-${index}`} className={`${styles.compactEditorCard} ${styles.compactEditorCardDanger}`}>
              <div className={styles.compactCardHeader}>
                <div>
                  <Typography.Text className={styles.compactCardTitle}>Inbox {index + 1}</Typography.Text>
                  <Typography.Text className={styles.compactCardSubtitle}>
                    This target can be selected by any handoff node in the bot.
                  </Typography.Text>
                </div>
                <Button
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={() =>
                    updateHandoffInboxes(
                      handoffInboxes.filter((_, inboxIndex) => inboxIndex !== index),
                    )
                  }
                >
                  Remove
                </Button>
              </div>

              <div className={styles.inlineFieldGrid}>
                <div>
                  <Typography.Text className={styles.fieldLabel}>Inbox Key</Typography.Text>
                  <Input
                    value={inbox.key}
                    placeholder="support"
                    onChange={(event) =>
                      updateHandoffInboxes(
                        handoffInboxes.map((candidate, inboxIndex) =>
                          inboxIndex === index ? { ...candidate, key: event.target.value } : candidate,
                        ),
                      )
                    }
                  />
                </div>

                <div>
                  <Typography.Text className={styles.fieldLabel}>Display Label</Typography.Text>
                  <Input
                    value={inbox.label}
                    placeholder="Support Team"
                    onChange={(event) =>
                      updateHandoffInboxes(
                        handoffInboxes.map((candidate, inboxIndex) =>
                          inboxIndex === index ? { ...candidate, label: event.target.value } : candidate,
                        ),
                      )
                    }
                  />
                </div>

                <div>
                  <Typography.Text className={styles.fieldLabel}>Recipient Email</Typography.Text>
                  <Input
                    value={inbox.email}
                    placeholder="support@company.com"
                    onChange={(event) =>
                      updateHandoffInboxes(
                        handoffInboxes.map((candidate, inboxIndex) =>
                          inboxIndex === index ? { ...candidate, email: event.target.value } : candidate,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            icon={<PlusOutlined />}
            onClick={() =>
              updateHandoffInboxes([
                ...handoffInboxes,
                createHandoffInbox(handoffInboxes.length + 1),
              ])
            }
          >
            Add handoff inbox
          </Button>
        </Space>
      </Modal>
    </>
  );
}

function createHandoffInbox(seed: number): HandoffInboxConfig {
  return {
    key: `inbox-${seed}`,
    label: `Inbox ${seed}`,
    email: "",
  };
}
