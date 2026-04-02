"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminShell } from "./AdminShell";
import { AuthRouteGuard } from "@/components/auth/AuthRouteGuard";

interface AdminLayoutFrameProps {
  children: ReactNode;
}

export function AdminLayoutFrame({ children }: AdminLayoutFrameProps) {
  const pathname = usePathname();
  const isStandaloneTemplateEditor = /^\/admin\/templates\/[^/]+$/.test(pathname);

  if (isStandaloneTemplateEditor) {
    return <AuthRouteGuard allowedRoles={["Admin"]}>{children}</AuthRouteGuard>;
  }

  return <AdminShell>{children}</AdminShell>;
}
