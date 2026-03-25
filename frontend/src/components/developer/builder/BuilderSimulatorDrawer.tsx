"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageOutlined, ReloadOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Drawer, Empty, Input, Space, Tag, Typography } from "antd";
import {
  advanceSimulator,
  createInitialSimulatorState,
  useBuilder,
} from "./builder-context";
import { useBuilderStyles } from "./styles";

const { Paragraph, Title } = Typography;

export function BuilderSimulatorDrawer() {
  const { styles } = useBuilderStyles();
  const { state, setSimulatorOpen } = useBuilder();
  const [draft, setDraft] = useState("");
  const simulator = useMemo(() => createInitialSimulatorState(state.graph), [state.graph]);
  const [runtime, setRuntime] = useState(simulator);

  useEffect(() => {
    setRuntime(simulator);
  }, [simulator]);

  const restartSimulation = () => {
    setRuntime(createInitialSimulatorState(state.graph));
    setDraft("");
  };

  const handleSend = () => {
    if (!draft.trim()) {
      return;
    }

    setRuntime((current) => advanceSimulator(state.graph, current, draft.trim()));
    setDraft("");
  };

  return (
    <Drawer
      title={
        <Space>
          <MessageOutlined />
          <span>Bot Simulator</span>
        </Space>
      }
      open={state.isSimulatorOpen}
      onClose={() => setSimulatorOpen(false)}
      width={420}
      extra={
        <Button icon={<ReloadOutlined />} onClick={restartSimulation}>
          Restart
        </Button>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div className={styles.simulatorMessages}>
          {runtime.messages.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No messages yet. Start the simulation to preview the bot."
            />
          ) : (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {runtime.messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? styles.simulatorUserBubble
                      : styles.simulatorBotBubble
                  }
                >
                  <span>{message.content}</span>
                </div>
              ))}
            </Space>
          )}
        </div>

        <div className={styles.simulatorMeta}>
          <Title level={5} style={{ margin: 0 }}>
            Runtime state
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            This MVP simulator walks through local graph state for linear flows, questions,
            conditions, and end nodes.
          </Paragraph>
          <Space wrap>
            <Tag color={runtime.awaitingInput ? "blue" : "default"}>
              {runtime.awaitingInput ? "Awaiting user input" : "Auto-running"}
            </Tag>
            <Tag>{runtime.currentNodeId ?? "Complete"}</Tag>
          </Space>
        </div>

        <Space.Compact style={{ width: "100%" }}>
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              runtime.awaitingInput
                ? "Type a reply to continue the flow"
                : "Input is available once the bot asks a question"
            }
            onPressEnter={handleSend}
            disabled={!runtime.awaitingInput}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!runtime.awaitingInput || !draft.trim()}
          >
            Send
          </Button>
        </Space.Compact>
      </Space>
    </Drawer>
  );
}
