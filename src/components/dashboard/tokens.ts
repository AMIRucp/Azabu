import type { CSSProperties } from "react";

export const dashboardTokens = {
  font: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    display: "'Space Grotesk', sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', monospace",
  },
  color: {
    white: "#FFFFFF",
    green: "#94FFBB",
    red: "#F87171",
    shortBadge: "#FF8383",
    orange: "#FF6B00",
    teal: "#00C2A8",
    memePink: "#F472B6",
    label: "#6B7280",
    muted: "#9CA3AF",
    navInactive: "#888888",
    navHover: "#AAAAAA",
    stroke: "rgba(255,255,255,0.05)",
    cardBorder: "#3E3E3E",
    rankLabel: "rgba(255,255,255,0.4)",
    rankMeta: "rgba(255,255,255,0.6)",
  },
  gradient: {
    card: "linear-gradient(180deg, #161616 0%, #0A0A0A 100%)",
    orange: "linear-gradient(90deg, #FF6B00 0%, #FFB800 100%)",
    leaderboardBtn:
      "conic-gradient(from 180.78deg at 45.42% 119.23%, #FFDD54 0deg, #FF6B00 62.31deg, #FF6B00 218.08deg, #FFE270 263.08deg, #FFDD54 360deg)",
    tradeBtn:
      "radial-gradient(39.37% 105% at 48.35% 166.67%, rgba(255,111,0,0.8) 0%, rgba(255,111,0,0.8) 39.48%, rgba(26,26,26,0.8) 100%)",
    titleText:
      "linear-gradient(90deg, #FFFFFF 0%, #FFFFFF 38%, rgba(190,190,190,0.55) 68%, rgba(90,90,90,0.35) 100%)",
    rankNumber:
      "linear-gradient(90deg, #FFFFFF 0%, #FFFFFF 48%, rgba(190,190,190,0.65) 78%, rgba(110,110,110,0.28) 100%)",
    rankProgress: "linear-gradient(90deg, #E67E22 0%, #F4A460 100%)",
    ambientGlow:
      "radial-gradient(ellipse at 50% 50%, #F28202 0%, #99260D 60%, transparent 100%)",
    ambientGlowSoft:
      "radial-gradient(ellipse at 50% 50%, rgba(242, 130, 2, 0.55) 0%, rgba(153, 38, 13, 0.22) 60%, transparent 100%)",
  },
  layout: {
    sidebarWidth: 290,
    accountCardWidth: 300,
    accountCardHeight: 275,
    accountCardPad: 20,
    accountCardHeaderGap: 32,
    accountCardRowGap: 18,
    rankCardWidth: 258,
    rankCardHeight: 560,
    rankCardGap: 22,
    rankListPadTop: 14,
    rankCardPadX: 9,
    rankCardPadLeft: 0,
    rankCardPadY: 16,
    leaderboardBtnWidth: 240,
    leaderboardBtnHeight: 39,
    trendingCardHeight: 309,
    openPositionCardHeight: 151,
    statCardMinHeight: 101,
    portfolioOverviewHeight: 107,
    portfolioOverviewTitleWidth: 255,
    portfolioOverviewTitleHeight: 104,
    portfolioOverviewTitleSize: 50,
    tickerToContentGap: 40,
    sidebarTopPad: 8,
    moversTableGrid: "50% 16% 13% 1fr",
    moversTablePadX: 18,
    moversTableHeaderPadY: 11,
    moversTableRowPadY: 13,
    moversTableGridMobile: "minmax(0, 1fr) auto 80px",
    moversTablePadXMobile: 14,
    portfolioOverviewTitleSizeMobile: 28,
    portfolioBalanceSizeMobile: 28,
    statCardValueSizeMobile: 22,
    statCardPadMobile: 16,
    trendingCardMinHeightMobile: 280,
  },
} as const;

const { color, gradient } = dashboardTokens;

export const cardStyle: CSSProperties = {
  background: gradient.card,
  border: `1px solid ${color.stroke}`,
  borderRadius: 16,
  boxSizing: "border-box",
};

export const sidebarCardStyle: CSSProperties = { ...cardStyle };

export const rankCardStyle: CSSProperties = { background: "#000000", borderRadius: 16, boxSizing: "border-box", border: "none" };

export const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 600,
  lineHeight: "22px",
  color: color.white,
  fontFamily: dashboardTokens.font.sans,
};

export const accountCardLabelStyle: CSSProperties = {
  fontSize: "10px",
  fontWeight: 600,
  lineHeight: "15px",
  letterSpacing: "0.1em",
  color: color.muted,
  fontFamily: dashboardTokens.font.sans,
  textTransform: "uppercase",
};

export const accountCardRowLabelStyle: CSSProperties = {
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: "18px",
  color: color.label,
  fontFamily: dashboardTokens.font.display,
};

export const accountCardRowValueStyle: CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  lineHeight: "16px",
  color: color.white,
  fontFamily: dashboardTokens.font.sans,
  textAlign: "right",
  flexShrink: 0,
};

export const statCardLabelStyle: CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  lineHeight: "15px",
  letterSpacing: "0.08em",
  color: color.label,
  fontFamily: dashboardTokens.font.sans,
  textTransform: "uppercase",
};

export const moverTableHeaderStyle: CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  lineHeight: "15px",
  letterSpacing: "1px",
  color: color.muted,
  fontFamily: dashboardTokens.font.sans,
  textTransform: "uppercase",
};
