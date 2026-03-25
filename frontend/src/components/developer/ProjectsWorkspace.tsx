"use client";

"use client";

import Link from "next/link";
import {
  EyeOutlined,
  GlobalOutlined,
  MessageOutlined,
  MobileOutlined,
  MoreOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Tag, Typography } from "antd";
import { PageHeader } from "./PageHeader";
import { useStyles } from "./styles";

const { Paragraph, Text, Title } = Typography;

interface ProjectCardData {
  id: string;
  name: string;
  status: "Active" | "Draft";
  edited: string;
  conversations: number;
  channels: ("web" | "whatsapp" | "slack")[];
}

const projects: ProjectCardData[] = [
  {
    id: "customer-support-bot",
    name: "Customer Support Bot",
    status: "Active",
    channels: ["web", "whatsapp"],
    edited: "2 hours ago",
    conversations: 1243,
  },
  {
    id: "lead-qualification-bot",
    name: "Lead Qualification Bot",
    status: "Draft",
    channels: ["web"],
    edited: "1 day ago",
    conversations: 0,
  },
  {
    id: "internal-it-helpdesk",
    name: "Internal IT Helpdesk",
    status: "Active",
    channels: ["slack"],
    edited: "3 days ago",
    conversations: 452,
  },
];

function ChannelIcons({ channels }: Pick<ProjectCardData, "channels">) {
  return (
    <Space size={6}>
      {channels.includes("web") ? <GlobalOutlined /> : null}
      {channels.includes("whatsapp") ? <MobileOutlined /> : null}
      {channels.includes("slack") ? <MessageOutlined /> : null}
    </Space>
  );
}

export function ProjectsWorkspace() {
  const { styles } = useStyles();

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

      <Row gutter={[20, 20]}>
        {projects.map((project) => (
          <Col xs={24} md={12} xl={8} key={project.id}>
            <Link href={`/developer/builder/${project.id}`}>
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
                    <Button
                      type="text"
                      icon={<MoreOutlined />}
                      aria-label="Project options"
                    />
                  </Space>

                  <div>
                    <Title level={4} style={{ marginBottom: 8 }}>
                      {project.name}
                    </Title>
                    <Space wrap size={10}>
                      <Tag color={project.status === "Active" ? "green" : "default"}>
                        {project.status}
                      </Tag>
                      <Text type="secondary">Edited {project.edited}</Text>
                    </Space>
                  </div>

                  <div className={styles.projectFooter}>
                    <Space
                      align="center"
                      style={{ justifyContent: "space-between", width: "100%" }}
                    >
                      <ChannelIcons channels={project.channels} />
                      <Text>
                        {project.conversations.toLocaleString()}{" "}
                        <Text type="secondary">chats</Text>
                      </Text>
                    </Space>
                  </div>
                </Space>
              </Card>
            </Link>
          </Col>
        ))}

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
