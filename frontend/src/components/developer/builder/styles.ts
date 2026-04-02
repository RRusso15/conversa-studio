"use client";

import { createStyles } from "antd-style";
import {
  INVERSE_INLINE_CODE_BACKGROUND,
  INVERSE_INLINE_CODE_BORDER,
  INVERSE_INLINE_CODE_TEXT,
  INVERSE_SURFACE_TEXT,
} from "@/theme/semantic-surfaces";

export const useBuilderStyles = createStyles(({ css, token }) => ({
  builderShell: css`
    height: 100dvh;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    background: ${token.colorBgContainer};
    overflow: hidden;
    min-width: 0;
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
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr) 10px var(--builder-right-panel-width, 360px);
    min-height: 0;
    min-width: 0;
    overflow: hidden;

    @media (max-width: 1320px) {
      grid-template-columns: 260px minmax(0, 1fr) 10px var(--builder-right-panel-width, 360px);
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
    min-width: 0;

    @media (max-width: 900px) {
      border-inline-end: none;
      border-bottom: 1px solid ${token.colorBorder};
    }
  `,
  builderRightPanel: css`
    border-inline-start: 1px solid ${token.colorBorder};
    background: ${token.colorBgContainer};
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    overflow: hidden;

    @media (max-width: 1100px) {
      grid-column: 1 / -1;
      border-inline-start: none;
      border-top: 1px solid ${token.colorBorder};
    }
  `,
  builderResizeHandle: css`
    position: relative;
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.98) 100%);
    border-inline-start: 1px solid rgba(226, 232, 240, 0.9);
    border-inline-end: 1px solid rgba(226, 232, 240, 0.9);
    cursor: col-resize;
    transition: background 0.18s ease;

    &::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 4px;
      height: 72px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.8);
      transform: translate(-50%, -50%);
      box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.92);
    }

    &:hover {
      background: linear-gradient(180deg, rgba(239, 246, 255, 0.96) 0%, rgba(224, 242, 254, 0.96) 100%);
    }

    @media (max-width: 1100px) {
      display: none;
    }
  `,
  builderSideSection: css`
    flex: 1 1 0;
    min-height: 0;
    overflow: auto;

    &:not(:last-child) {
      border-bottom: 1px solid ${token.colorBorder};
    }
  `,
  builderPropertiesSection: css`
    flex: 1 1 50%;
    min-height: 0;
    overflow: auto;
  `,
  builderValidationSection: css`
    flex: 1 1 50%;
    min-height: 0;
    overflow: auto;
  `,
  builderCanvasRegion: css`
    position: relative;
    min-height: 0;
    height: 100%;
    background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
    min-width: 0;
    overflow: hidden;
  `,
  builderCanvas: css`
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    overflow: hidden;

    .react-flow {
      width: 100%;
      height: 100%;
    }

    .react-flow__renderer,
    .react-flow__pane {
      cursor: default;
    }

    .react-flow__controls-button {
      border-color: ${token.colorBorder};
      color: ${token.colorTextBase};
    }
  `,
  builderCanvasControls: css`
    position: absolute;
    top: 18px;
    left: 18px;
    z-index: 6;
    padding: 8px;
    border: 1px solid rgba(226, 232, 240, 0.96);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(10px);
    box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);

    .ant-btn {
      min-width: 0;
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
  builderBlockedShell: css`
    min-height: min(78vh, 720px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  `,
  builderBlockedCard: css`
    width: min(100%, 720px);
    border-radius: 24px;
    border: 1px solid rgba(226, 232, 240, 0.95);
    background:
      radial-gradient(circle at top left, rgba(14, 165, 233, 0.08), transparent 30%),
      linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.92),
      0 24px 56px rgba(15, 23, 42, 0.08);

    .ant-result {
      padding: 48px 32px;
    }
  `,
  panelCard: css`
    min-height: auto;
    height: 100%;
    border-radius: 0 !important;
    box-shadow: none !important;
  `,
  validationPanelCard: css`
    height: 100%;
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
    width: 240px;
    border-radius: 22px;
    border: 1px solid rgba(148, 163, 184, 0.22);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, #f8fafc 100%);
    box-shadow:
      0 24px 44px rgba(15, 23, 42, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.84);
    overflow: hidden;
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      transform 0.18s ease;

    &[data-selected="true"] {
      border-color: var(--builder-node-accent);
      box-shadow:
        0 24px 44px rgba(15, 23, 42, 0.1),
        0 0 0 4px color-mix(in srgb, var(--builder-node-accent) 16%, white);
      transform: translateY(-2px);
    }

    &[data-node-type="condition"] {
      width: 270px;
    }
  `,
  flowNodeHeader: css`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 16px 14px;
    border-bottom: 1px solid rgba(226, 232, 240, 0.9);
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--builder-node-accent) 8%, white) 0%,
        color-mix(in srgb, var(--builder-node-accent) 3%, white) 100%
      );
  `,
  flowNodeIcon: css`
    width: 38px;
    height: 38px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--builder-node-accent) 18%, white);
    color: var(--builder-node-accent);
    font-size: 17px;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--builder-node-accent) 14%, white);
  `,
  flowNodeTitleBlock: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  flowNodeTag: css`
    margin-inline-end: 0 !important;
    border-radius: 999px !important;
    border-color: color-mix(in srgb, var(--builder-node-accent) 18%, white) !important;
    color: var(--builder-node-accent) !important;
    background: color-mix(in srgb, var(--builder-node-accent) 8%, white) !important;
  `,
  flowNodeMeta: css`
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #64748b;
  `,
  flowNodeMenuIcon: css`
    color: #94a3b8;
    font-size: 12px;
  `,
  flowNodeBody: css`
    padding: 12px 16px 16px;
    background: rgba(248, 250, 252, 0.92);
    font-size: 12px;
    line-height: 1.6;
  `,
  flowNodeSummary: css`
    display: block;
    color: #475569 !important;
  `,
  flowHandle: css`
    width: 12px !important;
    height: 12px !important;
    border: 2px solid #ffffff !important;
    background: var(--builder-node-accent) !important;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.72);
  `,
  conditionPaths: css`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 16px 16px;
    background: rgba(248, 250, 252, 0.92);
  `,
  conditionPathRow: css`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 56px;
    padding: 12px 18px 12px 14px;
    border: 1px solid rgba(203, 213, 225, 0.92);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  `,
  conditionPathLabel: css`
    display: block;
    color: #0f172a !important;
    font-weight: 700;
    margin-bottom: 2px;
  `,
  conditionPathRule: css`
    display: block;
    color: #64748b !important;
    font-size: 12px;
    max-width: 180px;
  `,
  conditionPathHandle: css`
    width: 12px !important;
    height: 12px !important;
    right: -7px !important;
    border: 2px solid #ffffff !important;
    background: var(--builder-node-accent) !important;
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.78);
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
  polishedPanelShell: css`
    overflow: hidden;
    border: 1px solid rgba(203, 213, 225, 0.9);
    border-radius: 20px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.9),
      0 16px 28px rgba(15, 23, 42, 0.05);
  `,
  polishedPanelHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(226, 232, 240, 0.9);
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.98) 100%);

    @media (max-width: 520px) {
      flex-direction: column;
      align-items: flex-start;
    }
  `,
  polishedPanelTitle: css`
    display: flex;
    align-items: center;
    gap: 10px;
    color: #0f172a;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  `,
  polishedPanelHeaderTags: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  `,
  polishedPanelTag: css`
    margin-inline-end: 0 !important;
    border-radius: 999px !important;
    border-color: rgba(148, 163, 184, 0.3) !important;
    background: rgba(248, 250, 252, 0.96) !important;
    color: #475569 !important;
  `,
  polishedPanelBody: css`
    padding: 14px;
  `,
  composerShell: css`
    overflow: hidden;
    border: 1px solid rgba(191, 219, 254, 0.8);
    border-radius: 18px;
    background:
      radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 36%),
      linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  `,
  composerHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(191, 219, 254, 0.7);
    background: rgba(239, 246, 255, 0.9);
  `,
  composerBody: css`
    padding: 14px;
  `,
  subtleTextarea: css`
    .ant-input {
      border-radius: 14px !important;
      padding: 14px 16px !important;
      background: rgba(255, 255, 255, 0.95) !important;
    }
  `,
  sectionNote: css`
    display: block;
    color: #64748b !important;
    font-size: 12px;
    line-height: 1.6;
  `,
  compactCardList: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  compactEditorCard: css`
    border: 1px solid rgba(203, 213, 225, 0.9);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.98);
    padding: 14px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  `,
  compactEditorCardAccent: css`
    border-color: rgba(125, 211, 252, 0.9);
    background:
      radial-gradient(circle at top left, rgba(14, 165, 233, 0.08), transparent 36%),
      rgba(255, 255, 255, 0.99);
  `,
  compactEditorCardWarm: css`
    border-color: rgba(253, 186, 116, 0.85);
    background:
      radial-gradient(circle at top left, rgba(249, 115, 22, 0.08), transparent 36%),
      rgba(255, 255, 255, 0.99);
  `,
  compactEditorCardPurple: css`
    border-color: rgba(196, 181, 253, 0.85);
    background:
      radial-gradient(circle at top left, rgba(124, 58, 237, 0.08), transparent 36%),
      rgba(255, 255, 255, 0.99);
  `,
  compactEditorCardDanger: css`
    border-color: rgba(252, 165, 165, 0.85);
    background:
      radial-gradient(circle at top left, rgba(220, 38, 38, 0.08), transparent 36%),
      rgba(255, 255, 255, 0.99);
  `,
  compactCardHeader: css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  `,
  compactCardTitle: css`
    display: block;
    color: #0f172a !important;
    font-weight: 700;
  `,
  compactCardSubtitle: css`
    display: block;
    color: #64748b !important;
    font-size: 12px;
    margin-top: 2px;
    line-height: 1.5;
  `,
  inlineFieldGrid: css`
    display: grid;
    gap: 12px;
  `,
  inlineFieldGridTwo: css`
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));

    @media (max-width: 520px) {
      grid-template-columns: 1fr;
    }
  `,
  fieldLabel: css`
    display: block;
    color: #334155 !important;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 8px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  `,
  reservedNotice: css`
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px dashed rgba(148, 163, 184, 0.9);
    background: rgba(248, 250, 252, 0.96);
  `,
  tokenRow: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  `,
  codeEditorShell: css`
    overflow: hidden;
    border: 1px solid #1f2937;
    border-radius: 20px;
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.12), transparent 34%),
      linear-gradient(180deg, #0f172a 0%, #111827 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      0 14px 30px rgba(15, 23, 42, 0.18);
  `,
  codeEditorHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
    background: rgba(15, 23, 42, 0.72);

    @media (max-width: 520px) {
      flex-direction: column;
      align-items: flex-start;
    }
  `,
  codeEditorTitle: css`
    display: flex;
    align-items: center;
    gap: 10px;
    color: #e2e8f0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  `,
  codeEditorDots: css`
    display: inline-flex;
    gap: 6px;

    span {
      width: 9px;
      height: 9px;
      border-radius: 999px;
      display: inline-flex;
    }

    span:nth-child(1) {
      background: #f97316;
    }

    span:nth-child(2) {
      background: #facc15;
    }

    span:nth-child(3) {
      background: #22c55e;
    }
  `,
  codeEditorHeaderTags: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  `,
  codeEditorTag: css`
    margin-inline-end: 0 !important;
    border: 1px solid rgba(148, 163, 184, 0.2) !important;
    border-radius: 999px !important;
    background: rgba(15, 23, 42, 0.4) !important;
    color: #cbd5e1 !important;
  `,
  codeEditorBody: css`
    padding: 14px;
  `,
  codeEditorBodyExpanded: css`
    padding: 18px;
  `,
  codeEditorTextarea: css`
    .ant-input {
      min-height: 280px !important;
      padding: 16px 18px !important;
      border: none !important;
      box-shadow: none !important;
      resize: none !important;
      background: rgba(15, 23, 42, 0.18) !important;
      color: #e5eefb !important;
      font-family:
        "Cascadia Code",
        "Fira Code",
        "JetBrains Mono",
        "SFMono-Regular",
        Consolas,
        "Liberation Mono",
        Menlo,
        monospace !important;
      font-size: 13px !important;
      line-height: 1.7 !important;
      caret-color: #38bdf8 !important;
    }

    .ant-input::placeholder {
      color: #64748b !important;
    }

    .ant-input:focus,
    .ant-input:focus-within {
      background: rgba(15, 23, 42, 0.32) !important;
    }

    .ant-input::selection {
      background: rgba(56, 189, 248, 0.3);
    }
  `,
  codeEditorTextareaExpanded: css`
    .ant-input {
      min-height: min(60vh, 640px) !important;
    }
  `,
  codeEditorHelp: css`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 14px;
    padding: 14px;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.14);
    background: rgba(15, 23, 42, 0.28);
  `,
  codeEditorHelpText: css`
    color: #cbd5e1 !important;

    &.ant-typography,
    .ant-typography {
      color: ${INVERSE_SURFACE_TEXT} !important;
    }

    code,
    .ant-typography code {
      background: ${INVERSE_INLINE_CODE_BACKGROUND} !important;
      border: 1px solid ${INVERSE_INLINE_CODE_BORDER} !important;
      color: ${INVERSE_INLINE_CODE_TEXT} !important;
      box-shadow: none !important;
    }
  `,
  codeEditorExamples: css`
    display: grid;
    gap: 10px;
  `,
  codeEditorExample: css`
    margin: 0;
    overflow: auto;
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(2, 6, 23, 0.72);
    color: #bfdbfe;
    border: 1px solid rgba(51, 65, 85, 0.9);
    font-family:
      "Cascadia Code",
      "Fira Code",
      "JetBrains Mono",
      "SFMono-Regular",
      Consolas,
      "Liberation Mono",
      Menlo,
      monospace;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
  `,
  codeEditorExpandButton: css`
    padding-inline: 10px !important;
    border-color: rgba(148, 163, 184, 0.2) !important;
    background: rgba(15, 23, 42, 0.28) !important;
    color: #cbd5e1 !important;

    &:hover,
    &:focus {
      color: #e2e8f0 !important;
      border-color: rgba(125, 211, 252, 0.34) !important;
      background: rgba(15, 23, 42, 0.4) !important;
    }
  `,
  codeEditorModal: css`
    .ant-modal-content {
      overflow: hidden;
      border-radius: 28px;
      padding: 0;
      background: transparent;
      box-shadow: 0 24px 64px rgba(15, 23, 42, 0.28);
    }

    .ant-modal-close {
      top: 18px;
      right: 18px;
      color: #cbd5e1;
    }
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
  simulatorSystemBubble: css`
    max-width: 92%;
    margin-inline: auto;
    padding: 10px 12px;
    border-radius: 14px;
    background: #f8fafc;
    color: #475569;
    border: 1px dashed ${token.colorBorder};
  `,
}));
