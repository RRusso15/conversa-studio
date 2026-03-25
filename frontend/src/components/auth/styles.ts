"use client";

import { createStyles } from "antd-style";

export const useStyles = createStyles(({ css, token }) => ({
  page: css`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 20px;
    background:
      radial-gradient(circle at top right, rgba(17, 17, 17, 0.06), transparent 26%),
      radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.12), transparent 30%),
      linear-gradient(180deg, #fcfcfd 0%, #f3f4f6 100%);
  `,
  shell: css`
    width: 100%;
    max-width: 1040px;
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(360px, 440px);
    gap: 24px;

    @media (max-width: 960px) {
      grid-template-columns: 1fr;
      max-width: 520px;
    }
  `,
  promoPanel: css`
    border-radius: 30px;
    padding: 36px;
    color: white;
    background: linear-gradient(160deg, #111111 0%, #1f2937 54%, #374151 100%);
    box-shadow: 0 28px 60px rgba(17, 17, 17, 0.16);
    overflow: hidden;
    position: relative;

    @media (max-width: 960px) {
      display: none;
    }
  `,
  promoGlow: css`
    position: absolute;
    inset: auto -60px -80px auto;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.12);
  `,
  promoCard: css`
    margin-top: 28px;
    border-radius: 24px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(16px);
  `,
  formPanel: css`
    border-radius: 30px;
    padding: 34px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(229, 231, 235, 0.96);
    box-shadow: 0 24px 50px rgba(17, 24, 39, 0.06);

    @media (max-width: 640px) {
      padding: 26px;
    }
  `,
  brandLink: css`
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
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
  header: css`
    margin-bottom: 20px;
  `,
  helperRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: -8px;
    margin-bottom: 20px;
  `,
  footer: css`
    text-align: center;
    margin-top: 24px;
  `,
  content: css`
    max-width: 420px;
  `,
}));
