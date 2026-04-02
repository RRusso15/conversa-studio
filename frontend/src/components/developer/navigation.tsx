import type { ReactNode } from "react";
import {
  BarChartOutlined,
  FolderOpenOutlined,
  HomeOutlined,
  RocketOutlined,
  SettingOutlined,
  SnippetsOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export interface DeveloperNavItem {
  key: string;
  label: string;
  href: string;
  icon: ReactNode;
}

export const developerNavItems: DeveloperNavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/developer/dashboard",
    icon: <HomeOutlined />,
  },
  {
    key: "projects",
    label: "Projects",
    href: "/developer/projects",
    icon: <FolderOpenOutlined />,
  },
  {
    key: "templates",
    label: "Templates",
    href: "/developer/templates",
    icon: <SnippetsOutlined />,
  },
  {
    key: "deployments",
    label: "Deployments",
    href: "/developer/deployments",
    icon: <RocketOutlined />,
  },
  {
    key: "transcripts",
    label: "Transcripts",
    href: "/developer/transcripts",
    icon: <TeamOutlined />,
  },
  {
    key: "analytics",
    label: "Analytics",
    href: "/developer/analytics",
    icon: <BarChartOutlined />,
  },
  {
    key: "settings",
    label: "Settings",
    href: "/developer/settings",
    icon: <SettingOutlined />,
  },
];

export const developerShellRoutes = new Set(
  developerNavItems.map((item) => item.href),
);
