"use client";

import Link from "next/link";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  ImportOutlined,
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
  backHref?: string;
  backLabel?: string;
  subtitle?: string;
  isDirty: boolean;
  validationCount: number;
  saveStatus: "idle" | "saving" | "saved" | "error" | "validation_blocked" | "permission_denied" | "api_mismatch";
  primaryActionLabel?: string;
  onBotNameChange: (name: string) => void;
  onSave: () => void;
  onExport: () => void;
  onImport: () => void;
  onValidate: () => void;
  onTest: () => void;
  onPrimaryAction: () => void;
}

export function BuilderToolbar({
  botName,
  backHref = "/developer/projects",
  backLabel = "Back to Projects",
  subtitle = "Build deterministic flows, AI-assisted routes, and validation-safe transitions.",
  isDirty,
  validationCount,
  saveStatus,
  primaryActionLabel,
  onBotNameChange,
  onSave,
  onExport,
  onImport,
  onValidate,
  onTest,
  onPrimaryAction,
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
          <Link href={backHref}>
            <Button icon={<ArrowLeftOutlined />}>{backLabel}</Button>
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
              {subtitle}
            </Paragraph>
          </div>
        </Space>
      </Flex>

      <Space wrap>
        <Button icon={<SaveOutlined />} onClick={onSave} loading={saveStatus === "saving"}>
          Save
        </Button>
        <Button icon={<DownloadOutlined />} onClick={onExport}>
          Export
        </Button>
        <Button icon={<ImportOutlined />} onClick={onImport}>
          Import
        </Button>
        <Button icon={<CheckCircleOutlined />} onClick={onValidate}>
          Validate
        </Button>
        <Button icon={<PlayCircleOutlined />} onClick={onTest}>
          Test
        </Button>
        <Button type="primary" icon={<RocketOutlined />} onClick={onPrimaryAction}>
          {primaryActionLabel ?? "Deploy"}
        </Button>
      </Space>
    </header>
  );
}
