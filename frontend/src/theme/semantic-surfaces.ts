"use client";

import type { ThemeConfig } from "antd";

export const SELECTED_SURFACE_BACKGROUND = "rgba(15, 23, 42, 0.08)";
export const SELECTED_SURFACE_BACKGROUND_HOVER = "rgba(15, 23, 42, 0.12)";
export const SELECTED_SURFACE_BORDER = "rgba(15, 23, 42, 0.14)";
export const SELECTED_SURFACE_TEXT = "#0f172a";
export const INVERSE_SURFACE_TEXT = "#e2e8f0";
export const INVERSE_INLINE_CODE_BACKGROUND = "rgba(148, 163, 184, 0.18)";
export const INVERSE_INLINE_CODE_BORDER = "rgba(148, 163, 184, 0.24)";
export const INVERSE_INLINE_CODE_TEXT = "#f8fafc";

export const semanticContrastTheme: ThemeConfig = {
    token: {
        colorPrimaryBg: SELECTED_SURFACE_BACKGROUND,
        colorPrimaryBgHover: SELECTED_SURFACE_BACKGROUND_HOVER,
        controlItemBgActive: SELECTED_SURFACE_BACKGROUND,
        controlItemBgActiveHover: SELECTED_SURFACE_BACKGROUND_HOVER,
        controlItemBgHover: "rgba(15, 23, 42, 0.04)"
    },
    components: {
        Menu: {
            itemSelectedBg: SELECTED_SURFACE_BACKGROUND,
            itemSelectedColor: SELECTED_SURFACE_TEXT,
            itemHoverColor: SELECTED_SURFACE_TEXT,
            itemHoverBg: "rgba(15, 23, 42, 0.04)",
            itemActiveBg: SELECTED_SURFACE_BACKGROUND_HOVER
        },
        Segmented: {
            trackBg: "#f3f4f6",
            itemSelectedBg: SELECTED_SURFACE_BACKGROUND,
            itemSelectedColor: SELECTED_SURFACE_TEXT
        },
        Select: {
            optionSelectedBg: SELECTED_SURFACE_BACKGROUND,
            optionSelectedColor: SELECTED_SURFACE_TEXT,
            optionActiveBg: SELECTED_SURFACE_BACKGROUND_HOVER
        },
        Tabs: {
            itemSelectedColor: SELECTED_SURFACE_TEXT,
            itemActiveColor: SELECTED_SURFACE_TEXT,
            itemHoverColor: SELECTED_SURFACE_TEXT,
            inkBarColor: SELECTED_SURFACE_TEXT
        }
    }
};
