"use client";

import type { ReactNode } from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Space, Typography } from "antd";
import { useStyles } from "./styles";

const { Paragraph, Text } = Typography;

interface InfoNoticeProps {
  title: string;
  description: string;
  icon?: ReactNode;
  style?: React.CSSProperties;
}

export function InfoNotice({
  title,
  description,
  icon,
  style,
}: InfoNoticeProps) {
  const { styles } = useStyles();

  return (
    <div className={styles.infoNotice} style={style}>
      <Space align="start" size={14} style={{ width: "100%" }}>
        <span className={styles.infoNoticeIcon}>
          {icon ?? <InfoCircleOutlined />}
        </span>
        <Space direction="vertical" size={6} style={{ width: "100%" }}>
          <Text strong className={styles.infoNoticeTitle}>
            {title}
          </Text>
          <Paragraph className={styles.infoNoticeDescription}>
            {description}
          </Paragraph>
        </Space>
      </Space>
    </div>
  );
}
