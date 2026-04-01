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

    @keyframes analyticsRiseIn {
      from {
        opacity: 0;
        transform: translateY(16px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes analyticsPulse {
      0% {
        box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.46);
      }

      70% {
        box-shadow: 0 0 0 12px rgba(52, 211, 153, 0);
      }

      100% {
        box-shadow: 0 0 0 0 rgba(52, 211, 153, 0);
      }
    }

    @keyframes analyticsBarGrow {
      from {
        transform: scaleY(0.2);
        opacity: 0.35;
      }

      to {
        transform: scaleY(1);
        opacity: 1;
      }
    }
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
  infoNotice: css`
    border-radius: 20px;
    border: 1px solid rgba(15, 23, 42, 0.12);
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.98) 100%);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
    padding: 16px 18px;
  `,
  infoNoticeIcon: css`
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.08);
    color: ${SELECTED_SURFACE_TEXT};
    flex-shrink: 0;
    font-size: 16px;
  `,
  infoNoticeTitle: css`
    color: ${token.colorTextBase};
    font-size: 15px;
    line-height: 1.4;
  `,
  infoNoticeDescription: css`
    color: ${token.colorTextSecondary};
    margin: 0;
    line-height: 1.7;
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
  analyticsHeroCard: css`
    position: relative;
    overflow: hidden;
    border-radius: 32px;
    border: 1px solid rgba(15, 23, 42, 0.1);
    background:
      radial-gradient(circle at top right, rgba(52, 211, 153, 0.28), transparent 34%),
      radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.22), transparent 30%),
      linear-gradient(135deg, #0f172a 0%, #111827 50%, #0f766e 100%);
    box-shadow: 0 24px 54px rgba(15, 23, 42, 0.18);
    color: #f8fafc;
  `,
  analyticsHeroGlow: css`
    position: absolute;
    inset: auto auto -80px -40px;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, transparent 72%);
    pointer-events: none;
  `,
  analyticsEyebrow: css`
    color: rgba(226, 232, 240, 0.82);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 11px;
    font-weight: 700;
  `,
  analyticsHeroTitle: css`
    margin: 10px 0 12px !important;
    color: #f8fafc !important;
    font-size: clamp(2rem, 4vw, 3.4rem) !important;
    line-height: 1.05 !important;
    letter-spacing: -0.04em;
    max-width: 12ch;
  `,
  analyticsHeroDescription: css`
    margin: 0 !important;
    color: rgba(226, 232, 240, 0.84) !important;
    font-size: 15px;
    line-height: 1.8;
    max-width: 60ch;
  `,
  analyticsHeroMetrics: css`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  `,
  analyticsMetricCard: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 140px;
    padding: 18px;
    border-radius: 22px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(18px);
    animation: analyticsRiseIn 0.7s ease both;
    transition:
      transform 0.22s ease,
      border-color 0.22s ease,
      box-shadow 0.22s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 18px 34px rgba(15, 23, 42, 0.18);
    }
  `,
  analyticsMetricCardCompact: css`
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-height: 122px;
    padding: 18px;
    border-radius: 22px;
    border: 1px solid ${token.colorBorder};
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.06);
    animation: analyticsRiseIn 0.7s ease both;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 34px rgba(15, 23, 42, 0.08);
    }
  `,
  analyticsMetricCardEmerald: css`
    box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.14);
  `,
  analyticsMetricCardBlue: css`
    box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.16);
  `,
  analyticsMetricCardAmber: css`
    box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.18);
  `,
  analyticsMetricCardPink: css`
    box-shadow: inset 0 0 0 1px rgba(244, 114, 182, 0.16);
  `,
  analyticsMetricCardSlate: css`
    box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.12);
  `,
  analyticsMetricHeader: css`
    display: flex;
    align-items: center;
    gap: 10px;
  `,
  analyticsMetricIcon: css`
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.12);
    color: inherit;
    font-size: 16px;
  `,
  analyticsMetricTitle: css`
    color: inherit;
    opacity: 0.78;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  `,
  analyticsMetricValue: css`
    color: inherit;
    font-size: clamp(2rem, 3.4vw, 2.8rem);
    line-height: 1;
    font-weight: 800;
    letter-spacing: -0.04em;
  `,
  analyticsMetricSuffix: css`
    font-size: 0.42em;
    opacity: 0.78;
    margin-left: 6px;
    font-weight: 700;
  `,
  analyticsLivePanel: css`
    padding: 18px;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(18px);
  `,
  analyticsLivePulse: css`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.5);
    animation: analyticsPulse 1.8s ease infinite;
  `,
  analyticsLiveLabel: css`
    color: #f8fafc;
    font-weight: 700;
  `,
  analyticsLiveStatRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: #f8fafc;
  `,
  analyticsHighlightGrid: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  `,
  analyticsHighlightCard: css`
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.08);
    transition: transform 0.2s ease;

    &:hover {
      transform: translateX(3px);
    }
  `,
  analyticsHighlightLabel: css`
    display: block;
    color: rgba(226, 232, 240, 0.72);
    font-size: 12px;
    margin-bottom: 6px;
  `,
  analyticsHighlightValue: css`
    color: #f8fafc;
    font-weight: 700;
    line-height: 1.5;
  `,
  analyticsPanelCard: css`
    height: 100%;
    border-radius: 28px;
    border: 1px solid ${token.colorBorder};
    background:
      radial-gradient(circle at top right, rgba(52, 211, 153, 0.08), transparent 28%),
      linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    box-shadow: 0 18px 42px rgba(15, 23, 42, 0.06);
  `,
  analyticsPanelEyebrow: css`
    color: #0f766e;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 11px;
    font-weight: 700;
  `,
  analyticsTrendSpotlight: css`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    padding: 18px;
    border-radius: 22px;
    border: 1px solid ${token.colorBorder};
    background: linear-gradient(135deg, rgba(15, 118, 110, 0.08) 0%, rgba(255, 255, 255, 0.98) 100%);

    @media (max-width: 640px) {
      flex-direction: column;
      align-items: stretch;
    }
  `,
  analyticsSpotlightLabel: css`
    color: ${token.colorTextSecondary};
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 11px;
    font-weight: 700;
  `,
  analyticsSpotlightDelta: css`
    min-width: 140px;
    padding: 12px 14px;
    border-radius: 18px;
    background: rgba(15, 23, 42, 0.04);
  `,
  analyticsSpotlightDeltaLabel: css`
    display: block;
    color: ${token.colorTextSecondary};
    font-size: 11px;
    margin-bottom: 6px;
  `,
  analyticsSpotlightDeltaValue: css`
    color: ${token.colorTextBase};
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.03em;
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
  analyticsTrendBarButton: css`
    appearance: none;
    border: 0;
    background: transparent;
    padding: 0;
    text-align: inherit;
    cursor: pointer;
    border-radius: 18px;
    transition: transform 0.18s ease, opacity 0.18s ease;

    &[data-active="true"] {
      transform: translateY(-6px);
    }

    &:not([data-active="true"]) {
      opacity: 0.72;
    }
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
    transition: height 0.2s ease, transform 0.18s ease;
    transform-origin: bottom;
    animation: analyticsBarGrow 0.65s ease both;
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
  analyticsJourneyRibbon: css`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;

    @media (max-width: 900px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 560px) {
      grid-template-columns: 1fr;
    }
  `,
  analyticsJourneyStep: css`
    appearance: none;
    border: 0;
    text-align: left;
    padding: 16px;
    border-radius: 22px;
    color: #f8fafc;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      opacity 0.2s ease;

    &[data-active="true"] {
      transform: translateY(-4px);
      box-shadow: 0 18px 32px rgba(15, 23, 42, 0.16);
    }

    &:not([data-active="true"]) {
      opacity: 0.82;
    }
  `,
  analyticsJourneyStepSlate: css`
    background: linear-gradient(135deg, #334155 0%, #111827 100%);
  `,
  analyticsJourneyStepEmerald: css`
    background: linear-gradient(135deg, #10b981 0%, #047857 100%);
  `,
  analyticsJourneyStepAmber: css`
    background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%);
  `,
  analyticsJourneyStepBlue: css`
    background: linear-gradient(135deg, #38bdf8 0%, #0369a1 100%);
  `,
  analyticsJourneyStepLabel: css`
    display: block;
    color: inherit;
    opacity: 0.82;
    margin-bottom: 10px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  `,
  analyticsJourneyStepValue: css`
    display: block;
    color: inherit;
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -0.04em;
    margin-bottom: 10px;
  `,
  analyticsJourneyCallout: css`
    padding: 18px;
    border-radius: 22px;
    border: 1px solid ${token.colorBorder};
    background: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%);
  `,
  analyticsJourneyCalloutEyebrow: css`
    display: block;
    color: ${token.colorTextSecondary};
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 11px;
    margin-bottom: 8px;
  `,
  analyticsJourneyCalloutTitle: css`
    display: block;
    color: ${token.colorTextBase};
    font-size: 18px;
    font-weight: 700;
    line-height: 1.5;
    margin-bottom: 8px;
  `,
  analyticsJourneyCalloutDescription: css`
    color: ${token.colorTextSecondary};
    margin: 0;
    line-height: 1.7;
  `,
  analyticsInsightGrid: css`
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  `,
  analyticsInsightCard: css`
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid ${token.colorBorder};
    transition: transform 0.18s ease;

    &:hover {
      transform: translateY(-2px);
    }
  `,
  analyticsInsightCardEmerald: css`
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, #ffffff 100%);
  `,
  analyticsInsightCardAmber: css`
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, #ffffff 100%);
  `,
  analyticsInsightCardSlate: css`
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.06) 0%, #ffffff 100%);
  `,
  analyticsInsightTitle: css`
    display: block;
    color: ${token.colorTextBase};
    font-weight: 700;
    margin-bottom: 6px;
  `,
  analyticsInsightDescription: css`
    color: ${token.colorTextSecondary};
    margin: 0;
    line-height: 1.7;
  `,
  analyticsBoardList: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  analyticsBoardItem: css`
    appearance: none;
    border: 0;
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 14px 16px;
    text-align: left;
    border-radius: 20px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid ${token.colorBorder};
    cursor: pointer;
    animation: analyticsRiseIn 0.7s ease both;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease;

    &[data-active="true"] {
      border-color: rgba(15, 118, 110, 0.24);
      box-shadow: 0 18px 28px rgba(15, 23, 42, 0.08);
      transform: translateY(-2px);
    }
  `,
  analyticsBoardItemRank: css`
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 118, 110, 0.12);
    color: #0f766e;
    font-weight: 800;
    flex-shrink: 0;
  `,
  analyticsBoardItemContent: css`
    flex: 1;
    min-width: 0;
  `,
  analyticsBoardItemValue: css`
    color: ${token.colorTextBase};
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.03em;
  `,
  analyticsBoardDetail: css`
    padding: 16px;
    border-radius: 20px;
    border: 1px solid ${token.colorBorder};
    background: linear-gradient(135deg, rgba(15, 118, 110, 0.08) 0%, #ffffff 100%);
  `,
  analyticsBoardDetailTitle: css`
    display: block;
    color: ${token.colorTextBase};
    font-size: 17px;
    font-weight: 700;
    margin-bottom: 10px;
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
