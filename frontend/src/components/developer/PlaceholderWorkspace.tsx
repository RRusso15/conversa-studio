"use client";

import { ArrowRightOutlined } from "@ant-design/icons";
import { Button, Card, Space, Typography } from "antd";
import { InfoNotice } from "./InfoNotice";
import { PageHeader } from "./PageHeader";
import { useStyles } from "./styles";

const { Paragraph } = Typography;

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
          <InfoNotice
            title={highlight}
            description="This destination is already part of the workspace so navigation stays complete while the surrounding product surfaces continue to expand."
          />
          <Paragraph type="secondary" style={{ maxWidth: 720, marginBottom: 0 }}>
            This area is available now so the developer workspace remains coherent and easy to navigate while the rest of the product experience continues to grow.
          </Paragraph>
          <Button type="default" icon={<ArrowRightOutlined />}>
            Coming next in the product flow
          </Button>
        </Space>
      </Card>
    </>
  );
}
