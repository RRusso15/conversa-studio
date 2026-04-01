"use client";

import { createStyles } from "antd-style";
import {
  SELECTED_SURFACE_BACKGROUND,
  SELECTED_SURFACE_BACKGROUND_HOVER,
  SELECTED_SURFACE_BORDER,
  SELECTED_SURFACE_TEXT,
} from "@/theme/semantic-surfaces";

export const useStyles = createStyles(({ css, token }) => ({
  shell: css`
    min-height: 100vh;
    background: ${token.colorBgLayout};
  `,
  mobileHeader: css`
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 18px;
    background: rgba(255, 255, 255, 0.9);
    border-bottom: 1px solid ${token.colorBorder};
    backdrop-filter: blur(12px);

    @media (min-width: 992px) {
      display: none;
    }
  `,
  desktopSidebar: css`
    position: sticky;
    top: 0;
    height: 100vh;
    border-inline-end: 1px solid ${token.colorBorder};
    background: ${token.colorBgContainer};

    @media (max-width: 991px) {
      display: none;
    }
  `,
  siderInner: css`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 20px 14px 16px;
  `,
  brand: css`
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 8px 10px 18px;
    color: ${token.colorTextBase};
    font-weight: 700;
    letter-spacing: -0.02em;
  `,
  brandMark: css`
    width: 42px;
    height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  `,
  nav: css`
    flex: 1;
    overflow: auto;
    padding-top: 8px;

    .ant-menu-item-selected,
    .ant-menu-submenu-selected > .ant-menu-submenu-title {
      background: ${SELECTED_SURFACE_BACKGROUND} !important;
      color: ${SELECTED_SURFACE_TEXT} !important;
      box-shadow: inset 0 0 0 1px ${SELECTED_SURFACE_BORDER};
    }

    .ant-menu-item-selected:hover,
    .ant-menu-submenu-selected > .ant-menu-submenu-title:hover {
      background: ${SELECTED_SURFACE_BACKGROUND_HOVER} !important;
      color: ${SELECTED_SURFACE_TEXT} !important;
    }

    .ant-menu-item-selected a,
    .ant-menu-item-selected .ant-menu-title-content,
    .ant-menu-item-selected .anticon,
    .ant-menu-submenu-selected > .ant-menu-submenu-title,
    .ant-menu-submenu-selected > .ant-menu-submenu-title .ant-menu-title-content,
    .ant-menu-submenu-selected > .ant-menu-submenu-title .anticon {
      color: ${SELECTED_SURFACE_TEXT} !important;
    }
  `,
  profileCard: css`
    margin-top: 16px;
    border-radius: 18px;
    border: 1px solid ${token.colorBorder};
    background: #f9fafb;
    padding: 12px;
  `,
  profileMeta: css`
    display: flex;
    align-items: center;
    gap: 12px;
  `,
  avatar: css`
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #111111;
    color: white;
    font-size: 13px;
    font-weight: 700;
  `,
  contentLayout: css`
    min-height: 100vh;
  `,
  content: css`
    padding: 28px;

    @media (max-width: 991px) {
      padding: 20px;
    }
  `,
  pageContainer: css`
    max-width: 1200px;
    margin: 0 auto;
  `,
  pageHeader: css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 28px;

    @media (max-width: 767px) {
      flex-direction: column;
      align-items: stretch;
    }
  `,
  statsCard: css`
    height: 100%;
    border-radius: 22px;
    border: 1px solid ${token.colorBorder};
    box-shadow: 0 16px 34px rgba(17, 24, 39, 0.04);
  `,
  projectCard: css`
    height: 100%;
    border-radius: 22px;
    border: 1px solid ${token.colorBorder};
    box-shadow: 0 16px 34px rgba(17, 24, 39, 0.04);
    cursor: pointer;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 24px 44px rgba(17, 24, 39, 0.08);
      border-color: rgba(16, 185, 129, 0.28);
    }
  `,
  projectIcon: css`
    width: 44px;
    height: 44px;
    border-radius: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(16, 185, 129, 0.12);
    color: #047857;
  `,
  projectFooter: css`
    margin-top: auto;
    padding-top: 18px;
    border-top: 1px solid ${token.colorBorder};
  `,
  transcriptLayout: css`
    display: grid;
    grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
    gap: 20px;
    align-items: stretch;
    min-height: calc(100vh - 220px);

    @media (max-width: 1100px) {
      grid-template-columns: 1fr;
      min-height: auto;
    }
  `,
  transcriptPane: css`
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-radius: 22px;
    border: 1px solid ${token.colorBorder};
    background: ${token.colorBgContainer};
    box-shadow: 0 16px 34px rgba(17, 24, 39, 0.04);

    @media (min-width: 1101px) {
      height: calc(100vh - 220px);
    }
  `,
  transcriptPaneHeader: css`
    flex-shrink: 0;
    padding: 18px 18px 14px;
    border-bottom: 1px solid ${token.colorBorder};
  `,
  transcriptPaneBody: css`
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 16px 18px 18px;

    @media (max-width: 1100px) {
      overflow: visible;
    }
  `,
  transcriptList: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  transcriptSessionCard: css`
    width: 100%;
    text-align: left;
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid ${token.colorBorder};
    background: #ffffff;
    cursor: pointer;
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      transform 0.18s ease;

    &:hover {
      transform: translateY(-1px);
      border-color: rgba(15, 23, 42, 0.14);
      box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
    }

    &[data-selected="true"] {
      background: rgba(15, 23, 42, 0.05);
      border-color: rgba(15, 23, 42, 0.16);
      box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
    }
  `,
  transcriptSessionPreview: css`
    display: block;
    color: ${token.colorTextSecondary};
    font-size: 12px;
    line-height: 1.6;
  `,
  transcriptMetaGrid: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 18px;

    @media (max-width: 520px) {
      grid-template-columns: 1fr;
    }
  `,
  transcriptMetaCard: css`
    padding: 14px;
    border-radius: 16px;
    border: 1px solid ${token.colorBorder};
    background: #f9fafb;
  `,
  transcriptMessages: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-right: 4px;
  `,
  transcriptMessageRow: css`
    display: flex;
  `,
  transcriptMessageRowUser: css`
    justify-content: flex-end;
  `,
  transcriptMessageRowBot: css`
    justify-content: flex-start;
  `,
  transcriptMessageBubble: css`
    max-width: min(80%, 720px);
    padding: 12px 14px;
    border-radius: 18px;
    border: 1px solid ${token.colorBorder};
    background: #ffffff;
    box-shadow: 0 10px 18px rgba(15, 23, 42, 0.03);
  `,
  transcriptMessageBubbleUser: css`
    background: #111111;
    border-color: #111111;
    color: #ffffff;
  `,
  transcriptMessageBubbleBot: css`
    background: #ffffff;
    color: ${token.colorTextBase};
  `,
  transcriptMessageTime: css`
    display: block;
    margin-top: 8px;
    font-size: 11px;
    opacity: 0.72;
  `,
  analyticsMetaCard: css`
    padding: 16px;
    border-radius: 18px;
    border: 1px solid ${token.colorBorder};
    background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
  `,
  analyticsTrendScroller: css`
    overflow-x: auto;
    padding-bottom: 6px;
  `,
  analyticsTrendBars: css`
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(48px, 1fr);
    gap: 10px;
    align-items: end;
    min-width: min-content;
    min-height: 260px;
  `,
  analyticsTrendBarColumn: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    min-width: 48px;
  `,
  analyticsTrendBarTrack: css`
    position: relative;
    width: 100%;
    height: 180px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 8px;
    border-radius: 16px;
    background:
      linear-gradient(180deg, rgba(15, 23, 42, 0.04) 0%, rgba(15, 23, 42, 0.08) 100%);
    border: 1px solid ${token.colorBorder};
  `,
  analyticsTrendBarFill: css`
    width: 100%;
    border-radius: 12px;
    background: linear-gradient(180deg, #34d399 0%, #047857 100%);
    box-shadow: 0 12px 20px rgba(4, 120, 87, 0.2);
    transition: height 0.2s ease;
  `,
  analyticsTrendValue: css`
    font-size: 12px;
    font-weight: 700;
    color: ${token.colorTextBase};
  `,
  analyticsTrendLabel: css`
    font-size: 11px;
    line-height: 1.4;
    color: ${token.colorTextSecondary};
    text-align: center;
  `,
  createCard: css`
    height: 100%;
    min-height: 260px;
    border-radius: 22px;
    border: 2px dashed ${token.colorBorder};
    background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    transition:
      border-color 0.18s ease,
      transform 0.18s ease;

    &:hover {
      border-color: rgba(16, 185, 129, 0.35);
      transform: translateY(-2px);
    }
  `,
  createIcon: css`
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #111111;
    color: white;
    margin-bottom: 16px;
  `,
  placeholderCard: css`
    border-radius: 24px;
    border: 1px solid ${token.colorBorder};
    box-shadow: 0 18px 36px rgba(17, 24, 39, 0.04);
  `,
  builderShell: css`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #ffffff;
  `,
  builderHeader: css`
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 14px 18px;
    border-bottom: 1px solid ${token.colorBorder};
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(12px);

    @media (max-width: 900px) {
      flex-direction: column;
      align-items: stretch;
    }
  `,
  builderMain: css`
    flex: 1;
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr) 320px;
    min-height: 0;

    @media (max-width: 1200px) {
      grid-template-columns: 240px minmax(0, 1fr);
    }

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  `,
  builderPanel: css`
    border-inline-end: 1px solid ${token.colorBorder};
    background: #ffffff;
    overflow: auto;

    @media (max-width: 900px) {
      border-inline-end: none;
      border-bottom: 1px solid ${token.colorBorder};
    }
  `,
  builderRightPanel: css`
    border-inline-start: 1px solid ${token.colorBorder};
    background: #ffffff;
    overflow: auto;

    @media (max-width: 1200px) {
      grid-column: 1 / -1;
      border-inline-start: none;
      border-top: 1px solid ${token.colorBorder};
    }
  `,
  builderCanvas: css`
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(circle at 1px 1px, rgba(107, 114, 128, 0.16) 1px, transparent 0);
    background-size: 28px 28px;
    min-height: 640px;
  `,
  builderCanvasInner: css`
    position: relative;
    min-height: 640px;
    max-width: 960px;
    margin: 0 auto;
  `,
  nodeCard: css`
    position: absolute;
    width: 176px;
    border-radius: 18px;
    border: 1px solid ${token.colorBorder};
    background: #ffffff;
    box-shadow: 0 18px 34px rgba(17, 24, 39, 0.08);
    overflow: hidden;
  `,
  nodeHeader: css`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-bottom: 1px solid ${token.colorBorder};
  `,
  nodeBody: css`
    padding: 10px 14px 12px;
    background: #f9fafb;
  `,
}));
