"use client";

import type { ReactNode } from "react";
import { Space, Typography } from "antd";
import { useStyles } from "./styles";

const { Paragraph, Title } = Typography;

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps) {
  const { styles } = useStyles();

  return (
    <div className={styles.pageHeader}>
      <div>
        <Title level={2} style={{ marginBottom: 8 }}>
          {title}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {description}
        </Paragraph>
      </div>

      {actions ? <Space>{actions}</Space> : null}
    </div>
  );
}
