"use client";

import Link from "next/link";
import {
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  SaveOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Button, Flex, Input, Space, Tag, Typography } from "antd";
import { useBuilderStyles } from "./styles";

const { Paragraph } = Typography;

interface BuilderToolbarProps {
  botName: string;
  isDirty: boolean;
  validationCount: number;
  saveStatus: "idle" | "saving" | "saved" | "error" | "validation_blocked" | "permission_denied" | "api_mismatch";
  onBotNameChange: (name: string) => void;
  onSave: () => void;
  onValidate: () => void;
  onTest: () => void;
}

export function BuilderToolbar({
  botName,
  isDirty,
  validationCount,
  saveStatus,
  onBotNameChange,
  onSave,
  onValidate,
  onTest,
}: BuilderToolbarProps) {
  const { styles } = useBuilderStyles();
  const statusTag = (() => {
    if (saveStatus === "saving") {
      return <Tag color="processing">Saving</Tag>;
    }

    if (saveStatus === "error") {
      return <Tag color="error">Save failed</Tag>;
    }

    if (saveStatus === "validation_blocked") {
      return <Tag color="warning">Validation blocked</Tag>;
    }

    if (saveStatus === "permission_denied") {
      return <Tag color="error">Permission denied</Tag>;
    }

    if (saveStatus === "api_mismatch") {
      return <Tag color="magenta">API mismatch</Tag>;
    }

    if (isDirty) {
      return <Tag color="default">Unsaved</Tag>;
    }

    return <Tag color="green">Saved</Tag>;
  })();

  return (
    <header className={styles.builderHeader}>
      <Flex justify="space-between" align="center" gap={16} wrap>
        <Space size="middle">
          <Link href="/developer/projects">
            <Button icon={<ArrowLeftOutlined />}>Back to Projects</Button>
          </Link>

          <div>
            <Space size={8} wrap>
              <Input
                value={botName}
                onChange={(event) => onBotNameChange(event.target.value)}
                aria-label="Bot name"
                placeholder="Untitled Bot"
                style={{ width: 280, maxWidth: "100%" }}
              />
              {statusTag}
              {validationCount > 0 ? (
                <Tag icon={<ExclamationCircleOutlined />} color="gold">
                  {validationCount} validation result{validationCount === 1 ? "" : "s"}
                </Tag>
              ) : null}
            </Space>
            <Paragraph type="secondary" style={{ margin: 0 }}>
              Build deterministic flows, AI-assisted routes, and validation-safe transitions.
            </Paragraph>
          </div>
        </Space>
      </Flex>

      <Space wrap>
        <Button icon={<SaveOutlined />} onClick={onSave} loading={saveStatus === "saving"}>
          Save
        </Button>
        <Button icon={<CheckCircleOutlined />} onClick={onValidate}>
          Validate
        </Button>
        <Button icon={<PlayCircleOutlined />} onClick={onTest}>
          Test
        </Button>
        <Button type="primary" icon={<RocketOutlined />} disabled>
          Deploy
        </Button>
      </Space>
    </header>
  );
}
