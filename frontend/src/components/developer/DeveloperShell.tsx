"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MenuOutlined } from "@ant-design/icons";
import { Button, Drawer, Grid, Layout, Space } from "antd";
import { AuthRouteGuard } from "@/components/auth/AuthRouteGuard";
import { DeveloperSidebar } from "./DeveloperSidebar";
import { NewBotLauncherButton } from "./NewBotLauncherButton";
import { useStyles } from "./styles";

const { Content, Sider } = Layout;

interface DeveloperShellProps {
  children: ReactNode;
}

export function DeveloperShell({ children }: DeveloperShellProps) {
  const [open, setOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const { styles } = useStyles();

  return (
    <AuthRouteGuard allowedRoles={["Admin", "Developer"]}>
      <Layout className={styles.shell}>
      <div className={styles.mobileHeader}>
        <Space>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          />
          <Link href="/" className={styles.brand}>
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
        </Space>

        <NewBotLauncherButton />
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement="left"
        closable={false}
        width={296}
        styles={{ body: { padding: 0 } }}
      >
        <DeveloperSidebar onNavigate={() => setOpen(false)} />
      </Drawer>

      <Layout hasSider className={styles.contentLayout}>
        {screens.lg ? (
          <Sider width={280} className={styles.desktopSidebar}>
            <DeveloperSidebar />
          </Sider>
        ) : null}

        <Layout>
          <Content className={styles.content}>
            <div className={styles.pageContainer}>{children}</div>
          </Content>
        </Layout>
      </Layout>
      </Layout>
    </AuthRouteGuard>
  );
}
