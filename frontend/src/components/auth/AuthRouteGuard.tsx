"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Flex, Spin } from "antd";
import { useAuthActions, useAuthState } from "@/providers/authProvider";
import type { IUserLoginInfo } from "@/providers/authProvider/context";
import { hasRole } from "@/utils/auth-roles";

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
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (allowedRoles?.length && !userHasAnyRole(user, allowedRoles)) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
        <Spin size="large" />
      </Flex>
    );
  }

  return <>{children}</>;
}

function userHasAnyRole(user: IUserLoginInfo, allowedRoles: string[]): boolean {
  return allowedRoles.some((allowedRole) => hasRole(user, allowedRole));
}
