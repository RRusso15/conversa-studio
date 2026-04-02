"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import type { IUserLoginInfo } from "@/providers/authProvider/context";
import { hasRole } from "@/utils/auth-roles";
import { AppLoader } from "@/components/shared/AppLoader";

interface AuthRouteGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function AuthRouteGuard({ children, allowedRoles }: AuthRouteGuardProps) {
  const router = useRouter();
  const { fetchCurrentUser } = useAuthActions();
  const { currentLoginInformations, isAuthenticated, isBootstrapped, isPending } = useAuthState();
  const user = currentLoginInformations?.user;

  useEffect(() => {
    if (!isBootstrapped) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!user) {
      void fetchCurrentUser();
      return;
    }

    if (allowedRoles?.length && !userHasAnyRole(user, allowedRoles)) {
      router.replace("/unauthorized");
    }
  }, [allowedRoles, fetchCurrentUser, isAuthenticated, isBootstrapped, router, user]);

  if (!isBootstrapped || isPending || !isAuthenticated || !user) {
    return <AppLoader label="Loading workspace" />;
  }

  if (allowedRoles?.length && !userHasAnyRole(user, allowedRoles)) {
    return <AppLoader label="Checking access" />;
  }

  return <>{children}</>;
}

function userHasAnyRole(user: IUserLoginInfo, allowedRoles: string[]): boolean {
  return allowedRoles.some((allowedRole) => hasRole(user, allowedRole));
}
