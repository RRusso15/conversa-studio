"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutOutlined, MenuOutlined } from "@ant-design/icons";
import { Button, Drawer, Grid, Layout, Menu, Space, Tag, Typography, type MenuProps } from "antd";
import { AuthRouteGuard } from "@/components/auth/AuthRouteGuard";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { adminNavItems } from "./navigation";

const { Content, Sider } = Layout;
const { Paragraph, Text } = Typography;

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [open, setOpen] = useState(false);
  const screens = Grid.useBreakpoint();

  return (
    <AuthRouteGuard allowedRoles={["Admin"]}>
      <Layout style={{ minHeight: "100vh", background: "#F7F8FA" }}>
        <div
          style={{
            display: screens.lg ? "none" : "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid #E5E7EB",
            background: "#FFFFFF",
          }}
        >
          <Space>
            <Button type="text" icon={<MenuOutlined />} onClick={() => setOpen(true)} aria-label="Open admin navigation" />
            <BrandLink />
          </Space>
        </div>

        <Drawer open={open} onClose={() => setOpen(false)} placement="left" closable={false} width={296} styles={{ body: { padding: 0 } }}>
          <AdminSidebar onNavigate={() => setOpen(false)} />
        </Drawer>

        <Layout hasSider>
          {screens.lg ? (
            <Sider width={280} style={{ background: "#FFFFFF", borderRight: "1px solid #E5E7EB" }}>
              <AdminSidebar />
            </Sider>
          ) : null}

          <Layout>
            <Content style={{ padding: 24 }}>
              <div style={{ maxWidth: 1320, margin: "0 auto" }}>{children}</div>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </AuthRouteGuard>
  );
}

interface AdminSidebarProps {
  onNavigate?: () => void;
}

function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  const { currentLoginInformations } = useAuthState();
  const user = currentLoginInformations?.user;
  const tenant = currentLoginInformations?.tenant;

  const selectedKey = adminNavItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.key ?? "dashboard";
  const items: MenuProps["items"] = adminNavItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: <Link href={item.href}>{item.label}</Link>,
  }));
  const displayName = useMemo(() => {
    const fullName = `${user?.name ?? ""} ${user?.surname ?? ""}`.trim();
    return fullName || user?.userName || "Administrator";
  }, [user?.name, user?.surname, user?.userName]);

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", padding: 20 }}>
      <BrandLink onNavigate={onNavigate} />

      <div style={{ marginTop: 20, flex: 1 }}>
        <Menu mode="inline" selectedKeys={[selectedKey]} items={items} style={{ borderInlineEnd: "none" }} onClick={onNavigate} />
      </div>

      <div
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: 20,
          padding: 16,
          background: "#FFFFFF",
        }}
      >
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <div>
            <Text strong>{displayName}</Text>
            <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>
              {user?.emailAddress ?? "Loading your profile..."}
            </Paragraph>
          </div>
          <Space style={{ justifyContent: "space-between", width: "100%" }}>
            <Tag color="volcano">{tenant?.name ?? tenant?.tenancyName ?? "Admin"}</Tag>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              size="small"
              onClick={() => {
                onNavigate?.();
                signOut();
              }}
            >
              Sign out
            </Button>
          </Space>
        </Space>
      </div>
    </div>
  );
}

function BrandLink({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate} style={{ display: "inline-flex", alignItems: "center", gap: 12, color: "#111827", fontWeight: 700 }}>
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111827",
        }}
      >
        <Image src="/images/logo.png" alt="Conversa Studio logo" width={24} height={24} />
      </span>
      <span>Conversa Studio Admin</span>
    </Link>
  );
}
