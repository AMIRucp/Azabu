"use client";

import { dashboardTokens } from "../tokens";

const { font, gradient, layout } = dashboardTokens;

const titleGradientStyle = {
  background: gradient.titleText,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
} as const;

export function PortfolioOverviewTitle({ isMobile = false }: { isMobile?: boolean }) {
  return (
    <h1
      style={{
        margin: 0,
        width: isMobile ? "auto" : layout.portfolioOverviewTitleWidth,
        minHeight: isMobile ? "auto" : layout.portfolioOverviewTitleHeight,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        fontFamily: font.sans,
        fontSize: isMobile ? layout.portfolioOverviewTitleSizeMobile : layout.portfolioOverviewTitleSize,
        fontWeight: 500,
        lineHeight: 1.02,
        letterSpacing: "-0.02em",
        flexShrink: isMobile ? 1 : 0,
        minWidth: isMobile ? 0 : undefined,
        ...titleGradientStyle,
      }}
    >
      <span style={{ display: "block" }}>Portfolio</span>
      <span style={{ display: "block" }}>Overview</span>
    </h1>
  );
}
