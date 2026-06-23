"use client";

import { cardStyle, dashboardTokens, statCardLabelStyle } from "../tokens";

const { font, color, layout } = dashboardTokens;

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  subColor?: string;
  isMobile?: boolean;
};

export function StatCard({
  label,
  value,
  sub,
  valueColor = color.white,
  subColor = color.label,
  isMobile = false,
}: StatCardProps) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: isMobile ? layout.statCardPadMobile : 24,
        minHeight: isMobile ? "auto" : layout.statCardMinHeight,
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 6 : 4,
        justifyContent: "center",
      }}
    >
      <div style={statCardLabelStyle}>{label}</div>
      <div
        style={{
          fontSize: isMobile ? layout.statCardValueSizeMobile : 28,
          fontWeight: 600,
          color: valueColor,
          fontFamily: font.sans,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub ? (
        <div style={{ fontSize: 12, fontWeight: 500, color: subColor, fontFamily: font.sans }}>{sub}</div>
      ) : null}
    </div>
  );
}
