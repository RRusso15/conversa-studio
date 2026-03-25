"use client";

import { createStyles } from "antd-style";

export const useBuilderStyles = createStyles(({ css, token }) => ({
  builderShell: css`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: ${token.colorBgContainer};
  `,
  builderHeader: css`
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 16px 18px;
    border-bottom: 1px solid ${token.colorBorder};
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(12px);

    @media (max-width: 920px) {
      flex-direction: column;
      align-items: stretch;
    }
  `,
  builderMain: css`
    flex: 1;
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr) 340px;
    min-height: 0;

    @media (max-width: 1320px) {
      grid-template-columns: 260px minmax(0, 1fr) 320px;
    }

    @media (max-width: 1100px) {
      grid-template-columns: 240px minmax(0, 1fr);
    }

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  `,
  builderPanel: css`
    border-inline-end: 1px solid ${token.colorBorder};
    background: ${token.colorBgContainer};
    overflow: auto;

    @media (max-width: 900px) {
      border-inline-end: none;
      border-bottom: 1px solid ${token.colorBorder};
    }
  `,
  builderRightPanel: css`
    border-inline-start: 1px solid ${token.colorBorder};
    background: ${token.colorBgContainer};
    overflow: auto;

    @media (max-width: 1100px) {
      grid-column: 1 / -1;
      border-inline-start: none;
      border-top: 1px solid ${token.colorBorder};
    }
  `,
  builderCanvasRegion: css`
    position: relative;
    min-height: 760px;
    background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
  `,
  builderCanvas: css`
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 760px;

    .react-flow__renderer,
    .react-flow__pane {
      cursor: default;
    }

    .react-flow__controls-button {
      border-color: ${token.colorBorder};
      color: ${token.colorTextBase};
    }
  `,
  builderEmptyOverlay: css`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  `,
  panelCard: css`
    min-height: 100%;
    border-radius: 0 !important;
    box-shadow: none !important;
  `,
  paletteButton: css`
    width: 100%;
    justify-content: flex-start;
    height: 46px;
    border-radius: 14px;
  `,
  flowNode: css`
    width: 220px;
    border-radius: 20px;
    border: 1px solid ${token.colorBorder};
    background: ${token.colorBgContainer};
    box-shadow: 0 18px 34px rgba(17, 24, 39, 0.08);
    overflow: hidden;
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      transform 0.18s ease;

    &[data-selected="true"] {
      border-color: var(--builder-node-accent);
      box-shadow:
        0 18px 34px rgba(17, 24, 39, 0.08),
        0 0 0 4px color-mix(in srgb, var(--builder-node-accent) 14%, white);
      transform: translateY(-2px);
    }
  `,
  flowNodeHeader: css`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid ${token.colorBorder};
    background: color-mix(in srgb, var(--builder-node-accent) 8%, white);
  `,
  flowNodeIcon: css`
    width: 34px;
    height: 34px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--builder-node-accent) 16%, white);
    color: var(--builder-node-accent);
    font-size: 16px;
  `,
  flowNodeTitleBlock: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  flowNodeBody: css`
    padding: 12px 16px 14px;
    background: #f9fafb;
    font-size: 12px;
    line-height: 1.5;
  `,
  flowHandle: css`
    width: 12px !important;
    height: 12px !important;
    border: 2px solid #ffffff !important;
    background: var(--builder-node-accent) !important;
  `,
  flowHandleLeft: css`
    width: 12px !important;
    height: 12px !important;
    bottom: -6px !important;
    left: 34% !important;
    border: 2px solid #ffffff !important;
    background: var(--builder-node-accent) !important;
  `,
  flowHandleRight: css`
    width: 12px !important;
    height: 12px !important;
    bottom: -6px !important;
    left: 66% !important;
    border: 2px solid #ffffff !important;
    background: #6b7280 !important;
  `,
  propertiesIcon: css`
    width: 38px;
    height: 38px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    color: ${token.colorTextBase};
    font-size: 18px;
  `,
  simulatorMessages: css`
    min-height: 320px;
    max-height: 52vh;
    overflow: auto;
    padding: 12px;
    border: 1px solid ${token.colorBorder};
    border-radius: 18px;
    background: #f9fafb;
  `,
  simulatorMeta: css`
    padding: 14px;
    border-radius: 18px;
    border: 1px solid ${token.colorBorder};
    background: ${token.colorBgContainer};
  `,
  simulatorBotBubble: css`
    max-width: 86%;
    padding: 12px 14px;
    border-radius: 18px 18px 18px 6px;
    background: #ffffff;
    border: 1px solid ${token.colorBorder};
  `,
  simulatorUserBubble: css`
    max-width: 86%;
    margin-left: auto;
    padding: 12px 14px;
    border-radius: 18px 18px 6px 18px;
    background: #111111;
    color: #ffffff;
  `,
}));
