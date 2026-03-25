"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { Card, Space, Tag, Typography } from "antd";
import { useStyles } from "./styles";

const { Paragraph, Text, Title } = Typography;

interface AuthLayoutShellProps {
  children: ReactNode;
}

export function AuthLayoutShell({ children }: AuthLayoutShellProps) {
  const { styles } = useStyles();

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.promoPanel}>
          <div className={styles.promoGlow} />
          <Tag color="green" bordered={false}>
            Public auth surface
          </Tag>
          <Title level={2} style={{ color: "white", marginTop: 18 }}>
            Begin with a cleaner chatbot workspace
          </Title>
          <Paragraph style={{ color: "rgba(255,255,255,0.74)", fontSize: 16 }}>
            Sign in and account creation now share a single route-group layout,
            so the auth surface stays consistent as we wire real backend flows.
          </Paragraph>

          <Card className={styles.promoCard} bordered={false}>
            <Space direction="vertical" size="middle">
              <Text style={{ color: "white" }}>
                Conversa Studio is being shaped as a real SaaS platform, not a
                disposable prototype.
              </Text>
              <Space align="start">
                <SafetyCertificateOutlined
                  style={{ color: "#6ee7b7", marginTop: 3 }}
                />
                <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                  UI-only for now, but structured for backend auth and
                  onboarding next.
                </Text>
              </Space>
            </Space>
          </Card>
        </aside>

        <section className={styles.formPanel}>
          <div className={styles.content}>
            <Link href="/" className={styles.brandLink}>
              <span className={styles.brandMark}>
                <Image
                  src="/images/logo.png"
                  alt="Conversa Studio logo"
                  width={28}
                  height={28}
                />
              </span>
              <span>Conversa Studio</span>
            </Link>

            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
