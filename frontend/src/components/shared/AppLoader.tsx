"use client";

import Image from "next/image";
import { Typography } from "antd";

const { Text } = Typography;

interface AppLoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export function AppLoader({
  label = "Loading workspace",
  fullScreen = true,
}: AppLoaderProps) {
  return (
    <div
      className={fullScreen ? "app-loader-screen" : "app-loader-inline"}
      role="status"
      aria-live="polite"
    >
      <div className="app-loader-mark">
        <Image
          src="/images/logo.png"
          alt="Conversa Studio logo"
          width={34}
          height={34}
        />
      </div>
      <div className="app-loader-pulse" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <Text className="app-loader-label">{label}</Text>
    </div>
  );
}
