"use client";

import type { ReactNode } from "react";
import { App as AntdApp, ConfigProvider, theme } from "antd";
import type { ThemeConfig } from "antd";
import { ThemeProvider } from "antd-style";
import themeConfig from "@/theme/theme.json";

interface AntdProviderProps {
  children: ReactNode;
}

const appTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  ...themeConfig,
  token: {
    ...themeConfig.token,
    fontFamily:
      "var(--font-geist-sans), 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  },
};

export function AntdProvider({ children }: AntdProviderProps) {
  return (
    <ConfigProvider theme={appTheme}>
      <ThemeProvider appearance="light" themeMode="light">
        <AntdApp>{children}</AntdApp>
      </ThemeProvider>
    </ConfigProvider>
  );
}
