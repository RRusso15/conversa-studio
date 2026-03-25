"use client";

import { createStyles } from "antd-style";

export const useStyles = createStyles(({ css, token }) => ({
  page: css`
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(17, 17, 17, 0.05), transparent 28%),
      radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.08), transparent 26%),
      linear-gradient(180deg, #ffffff 0%, #f9fafb 48%, #ffffff 100%);
  `,
  navShell: css`
    position: sticky;
    top: 0;
    z-index: 20;
    backdrop-filter: blur(18px);
    background: rgba(255, 255, 255, 0.86);
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  `,
  navInner: css`
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 24px;
    min-height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  `,
  brandLink: css`
    display: inline-flex;
    align-items: center;
    gap: 12px;
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
  `,
  heroSection: css`
    max-width: 1180px;
    margin: 0 auto;
    padding: 72px 24px 32px;
    text-align: center;
  `,
  heroBadge: css`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 999px;
    background: rgba(16, 185, 129, 0.12);
    color: #047857;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 24px;
  `,
  heroTitle: css`
    margin: 0;
    max-width: 720px;
    margin-inline: auto;
    font-size: clamp(2.75rem, 7vw, 5.5rem);
    line-height: 0.98;
    letter-spacing: -0.05em;
  `,
  gradientText: css`
    background: linear-gradient(135deg, #111111 0%, #374151 62%, #10b981 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  `,
  heroCopy: css`
    max-width: 620px;
    margin-top: 24px;
    margin-inline: auto;
    font-size: 18px;
    line-height: 1.8;
    color: ${token.colorTextSecondary};
  `,
  heroActions: css`
    margin-top: 32px;
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    justify-content: center;
  `,
  previewCard: css`
    margin-top: 44px;
    border-radius: 28px;
    border: 1px solid rgba(229, 231, 235, 0.94);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(249, 250, 251, 0.94));
    box-shadow: 0 24px 60px rgba(17, 24, 39, 0.08);
    overflow: hidden;
  `,
  previewTop: css`
    display: grid;
    grid-template-columns: 280px 1fr 320px;
    gap: 18px;
    padding: 22px;

    @media (max-width: 1100px) {
      grid-template-columns: 1fr;
    }
  `,
  panel: css`
    border-radius: 22px;
    border: 1px solid rgba(229, 231, 235, 0.94);
    background: rgba(255, 255, 255, 0.88);
    padding: 18px;
  `,
  paletteItem: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-radius: 16px;
    background: #f9fafb;
    margin-top: 10px;
  `,
  canvas: css`
    position: relative;
    min-height: 360px;
    border-radius: 22px;
    background:
      radial-gradient(circle at 1px 1px, rgba(107, 114, 128, 0.18) 1px, transparent 0);
    background-size: 28px 28px;
    overflow: hidden;
  `,
  canvasNodePrimary: css`
    position: absolute;
    top: 64px;
    left: 54px;
    width: 150px;
    padding: 16px;
    border-radius: 18px;
    color: white;
    background: linear-gradient(135deg, #111111 0%, #374151 100%);
    box-shadow: 0 18px 30px rgba(17, 17, 17, 0.18);
  `,
  canvasNodeSecondary: css`
    position: absolute;
    top: 170px;
    right: 72px;
    width: 180px;
    padding: 16px;
    border-radius: 18px;
    background: white;
    border: 1px solid rgba(229, 231, 235, 0.94);
    box-shadow: 0 18px 30px rgba(17, 24, 39, 0.08);
  `,
  canvasNodeTertiary: css`
    position: absolute;
    bottom: 54px;
    left: 42%;
    width: 160px;
    padding: 14px;
    border-radius: 18px;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.24);
  `,
  canvasConnectorOne: css`
    position: absolute;
    top: 142px;
    left: 190px;
    width: 220px;
    height: 120px;
    border: 2px dashed rgba(17, 17, 17, 0.18);
    border-right: none;
    border-top: none;
    border-bottom-left-radius: 30px;
  `,
  canvasConnectorTwo: css`
    position: absolute;
    top: 238px;
    left: 46%;
    width: 160px;
    height: 86px;
    border: 2px dashed rgba(16, 185, 129, 0.24);
    border-left: none;
    border-top: none;
    border-bottom-right-radius: 28px;
  `,
  section: css`
    max-width: 1180px;
    margin: 0 auto;
    padding: 90px 24px 0;
  `,
  sectionHeader: css`
    max-width: 720px;
    margin-bottom: 32px;
  `,
  featureCard: css`
    height: 100%;
    border-radius: 22px;
    border: 1px solid rgba(229, 231, 235, 0.94);
    box-shadow: 0 18px 36px rgba(17, 24, 39, 0.05);
  `,
  featureIcon: css`
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(16, 185, 129, 0.1);
    color: #047857;
    margin-bottom: 18px;
  `,
  pricingCard: css`
    height: 100%;
    border-radius: 26px;
    border: 1px solid rgba(229, 231, 235, 0.94);
    box-shadow: 0 22px 40px rgba(17, 24, 39, 0.06);
  `,
  pricingFeatured: css`
    position: relative;
    overflow: hidden;
    border-color: rgba(16, 185, 129, 0.28);
    box-shadow: 0 24px 44px rgba(16, 185, 129, 0.12);
  `,
  pricingRibbon: css`
    position: absolute;
    top: 18px;
    right: 18px;
  `,
  price: css`
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin: 12px 0 24px;
  `,
  footerCta: css`
    max-width: 1180px;
    margin: 0 auto;
    padding: 90px 24px 120px;
  `,
  footerCard: css`
    border-radius: 30px;
    padding: 44px;
    background: linear-gradient(135deg, #111111 0%, #1f2937 65%, #10b981 100%);
    color: white;
    box-shadow: 0 28px 60px rgba(17, 17, 17, 0.16);
  `,
}));
