"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Menu,
  Space,
  Tag,
  Typography,
  type MenuProps,
} from "antd";
import { developerNavItems } from "./navigation";
import { useStyles } from "./styles";

const { Paragraph, Text } = Typography;

interface DeveloperSidebarProps {
  onNavigate?: () => void;
}

export function DeveloperSidebar({ onNavigate }: DeveloperSidebarProps) {
  const pathname = usePathname();
  const { styles } = useStyles();

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

      <Link href="/developer/builder/new" onClick={onNavigate}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          block
          style={{ marginBottom: 18 }}
        >
          New Bot
        </Button>
      </Link>

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
            <span className={styles.avatar}>DV</span>
            <div>
              <Text strong>Developer User</Text>
              <Paragraph
                type="secondary"
                style={{ margin: 0, fontSize: 12, lineHeight: 1.4 }}
              >
                developer@conversa.studio
              </Paragraph>
            </div>
          </div>

          <Space style={{ justifyContent: "space-between", width: "100%" }}>
            <Tag color="green">Developer</Tag>
            <Button type="text" icon={<LogoutOutlined />} size="small">
              Sign out
            </Button>
          </Space>
        </Space>
      </div>
    </div>
  );
}
