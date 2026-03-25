import type { ReactNode } from "react";
import { AuthLayoutShell } from "@/components/auth/AuthLayoutShell";

interface AuthGroupLayoutProps {
  children: ReactNode;
}

export default function AuthGroupLayout({ children }: AuthGroupLayoutProps) {
  return <AuthLayoutShell>{children}</AuthLayoutShell>;
}
