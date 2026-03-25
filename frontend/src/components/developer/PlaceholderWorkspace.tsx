"use client";

import { ArrowRightOutlined } from "@ant-design/icons";
import { Button, Card, Space, Typography } from "antd";
import { PageHeader } from "./PageHeader";
import { useStyles } from "./styles";

const { Paragraph, Text } = Typography;

interface PlaceholderWorkspaceProps {
  title: string;
  description: string;
  highlight: string;
}

export function PlaceholderWorkspace({
  title,
  description,
  highlight,
}: PlaceholderWorkspaceProps) {
  const { styles } = useStyles();

  return (
    <>
      <PageHeader title={title} description={description} />

      <Card className={styles.placeholderCard}>
        <Space direction="vertical" size="large">
          <Text strong>{highlight}</Text>
          <Paragraph type="secondary" style={{ maxWidth: 720, marginBottom: 0 }}>
            This area is intentionally scaffolded for the MVP so the developer
            workspace navigation is complete and non-broken while we focus on
            bots, the builder, and core flow execution first.
          </Paragraph>
          <Button type="default" icon={<ArrowRightOutlined />}>
            Coming next in the product flow
          </Button>
        </Space>
      </Card>
    </>
  );
}
