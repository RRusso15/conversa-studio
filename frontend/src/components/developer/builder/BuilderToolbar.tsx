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
import { Button, Flex, Space, Tag, Typography } from "antd";
import { useBuilderStyles } from "./styles";

const { Paragraph, Title } = Typography;

interface BuilderToolbarProps {
  botName: string;
  isDirty: boolean;
  validationCount: number;
  onSave: () => void;
  onValidate: () => void;
  onTest: () => void;
}

export function BuilderToolbar({
  botName,
  isDirty,
  validationCount,
  onSave,
  onValidate,
  onTest,
}: BuilderToolbarProps) {
  const { styles } = useBuilderStyles();

  return (
    <header className={styles.builderHeader}>
      <Flex justify="space-between" align="center" gap={16} wrap>
        <Space size="middle">
          <Link href="/developer/projects">
            <Button icon={<ArrowLeftOutlined />}>Back to Projects</Button>
          </Link>

          <div>
            <Space size={8} wrap>
              <Title level={4} style={{ margin: 0 }}>
                {botName}
              </Title>
              <Tag color={isDirty ? "default" : "green"}>{isDirty ? "Unsaved" : "Saved"}</Tag>
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
        <Button icon={<SaveOutlined />} onClick={onSave}>
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
