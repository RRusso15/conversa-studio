import type { ReactNode } from "react";
import { AdminLayoutFrame } from "@/components/admin/AdminLayoutFrame";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminLayoutFrame>{children}</AdminLayoutFrame>;
}
