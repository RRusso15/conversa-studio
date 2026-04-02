import type { ReactNode } from "react";
import {
  AppstoreOutlined,
  DashboardOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export interface AdminNavItem {
  key: string;
  label: string;
  href: string;
  icon: ReactNode;
}

export const adminNavItems: AdminNavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/admin",
    icon: <DashboardOutlined />,
  },
  {
    key: "templates",
    label: "Templates",
    href: "/admin/templates",
    icon: <AppstoreOutlined />,
  },
  {
    key: "admins",
    label: "Admins",
    href: "/admin/admins",
    icon: <TeamOutlined />,
  },
];
