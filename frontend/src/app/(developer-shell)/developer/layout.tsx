import type { ReactNode } from "react";
import { DeveloperShell } from "@/components/developer/DeveloperShell";

interface DeveloperLayoutProps {
  children: ReactNode;
}

export default function DeveloperLayout({ children }: DeveloperLayoutProps) {
  return <DeveloperShell>{children}</DeveloperShell>;
}
