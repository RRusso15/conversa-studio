"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AppstoreOutlined,
  FileAddOutlined,
  FormOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Card, Modal, Space, Typography } from "antd";

const { Paragraph, Text, Title } = Typography;

interface NewBotLauncherButtonProps {
  block?: boolean;
  icon?: ReactNode;
  label?: string;
  onNavigate?: () => void;
  size?: "small" | "middle" | "large";
  type?: "default" | "primary" | "dashed" | "link" | "text";
}

export function NewBotLauncherButton({
  block,
  icon,
  label = "New Bot",
  onNavigate,
  size = "middle",
  type = "primary",
}: NewBotLauncherButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleNavigate = (href: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };

  return (
    <>
      <Button
        block={block}
        icon={icon ?? <PlusOutlined />}
        size={size}
        type={type}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        title="Create a new bot"
        width={760}
        centered
      >
        <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 20 }}>
          Choose how you want to start building.
        </Paragraph>

        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <CreationOptionCard
            icon={<FileAddOutlined />}
            title="Blank canvas"
            description="Start in the builder with an empty draft bot and shape the flow yourself."
            actionLabel="Open blank builder"
            onClick={() => handleNavigate("/developer/builder/new")}
          />
          <CreationOptionCard
            icon={<AppstoreOutlined />}
            title="From template"
            description="Browse reusable starter flows, preview them, and create a new bot from a published template."
            actionLabel="Open template library"
            onClick={() => handleNavigate("/developer/templates")}
          />
          <CreationOptionCard
            icon={<FormOutlined />}
            title="From prompt"
            description="Describe the bot you want and generate a builder-ready draft from a Gemini-powered prompt."
            actionLabel="Open prompt builder"
            onClick={() => handleNavigate("/developer/create/prompt")}
          />
        </Space>
      </Modal>
    </>
  );
}

interface CreationOptionCardProps {
  actionLabel: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  title: string;
}

function CreationOptionCard({
  actionLabel,
  description,
  icon,
  onClick,
  title,
}: CreationOptionCardProps) {
  return (
    <Card hoverable onClick={onClick}>
      <Space align="start" size="middle" style={{ width: "100%", justifyContent: "space-between" }}>
        <Space align="start" size="middle">
          <span
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#F3F4F6",
              color: "#111827",
              fontSize: 18,
            }}
          >
            {icon}
          </span>
          <div>
            <Title level={4} style={{ marginBottom: 6 }}>
              {title}
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {description}
            </Paragraph>
          </div>
        </Space>

        <Text strong>{actionLabel}</Text>
      </Space>
    </Card>
  );
}
