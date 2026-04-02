"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutOutlined } from "@ant-design/icons";
import {
  Button,
  Menu,
  Space,
  Tag,
  Typography,
  type MenuProps,
} from "antd";
import { developerNavItems } from "./navigation";
import { NewBotLauncherButton } from "./NewBotLauncherButton";
import { useStyles } from "./styles";
import { useAuthActions, useAuthState } from "@/providers/authProvider";

const { Paragraph, Text } = Typography;

interface DeveloperSidebarProps {
  onNavigate?: () => void;
}

export function DeveloperSidebar({ onNavigate }: DeveloperSidebarProps) {
  const pathname = usePathname();
  const { styles } = useStyles();
  const { signOut } = useAuthActions();
  const { currentLoginInformations, isPending, isBootstrapped } = useAuthState();

  const user = currentLoginInformations?.user;
  const tenant = currentLoginInformations?.tenant;
  const displayName = useMemo(() => {
    const fullName = `${user?.name ?? ""} ${user?.surname ?? ""}`.trim();

    if (fullName) {
      return fullName;
    }

    return user?.userName ?? "Developer";
  }, [user?.name, user?.surname, user?.userName]);
  const emailAddress = user?.emailAddress ?? "Loading your profile...";
  const profileTag = tenant?.name ?? tenant?.tenancyName ?? "Workspace";
  const initials = useMemo(() => {
    const initialParts = [user?.name, user?.surname]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));

    if (initialParts.length > 0) {
      return initialParts
        .slice(0, 2)
        .map((value) => value[0]?.toUpperCase() ?? "")
        .join("");
    }

    return (user?.userName ?? "DV").slice(0, 2).toUpperCase();
  }, [user?.name, user?.surname, user?.userName]);

  const selectedKey =
    developerNavItems.find((item) => pathname.startsWith(item.href))?.key ??
    "dashboard";

  const items: MenuProps["items"] = developerNavItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: <Link href={item.href}>{item.label}</Link>,
  }));

  return (
    <div className={styles.siderInner}>
      <Link href="/" className={styles.brand} onClick={onNavigate}>
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

      <div style={{ marginBottom: 18 }}>
        <NewBotLauncherButton block size="large" onNavigate={onNavigate} />
      </div>

      <div className={styles.nav}>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
          style={{ borderInlineEnd: "none" }}
          onClick={onNavigate}
        />
      </div>

      <div className={styles.profileCard}>
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <div className={styles.profileMeta}>
            <span className={styles.avatar}>{initials}</span>
            <div>
              <Text strong>{displayName}</Text>
              <Paragraph
                type="secondary"
                style={{ margin: 0, fontSize: 12, lineHeight: 1.4 }}
              >
                {emailAddress}
              </Paragraph>
            </div>
          </div>

          <Space style={{ justifyContent: "space-between", width: "100%" }}>
            <Tag color="green">{profileTag}</Tag>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              size="small"
              disabled={!isBootstrapped && isPending}
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
