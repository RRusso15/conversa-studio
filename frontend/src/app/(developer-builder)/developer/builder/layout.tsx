import type { ReactNode } from "react";
import { AuthRouteGuard } from "@/components/auth/AuthRouteGuard";

interface DeveloperBuilderLayoutProps {
  children: ReactNode;
}

export default function DeveloperBuilderLayout({ children }: DeveloperBuilderLayoutProps) {
  return <AuthRouteGuard allowedRoles={["Admin", "Developer"]}>{children}</AuthRouteGuard>;
}
