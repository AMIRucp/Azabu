"use client";

import { TRENDING_META } from "../demoData";
import { fmtPct, fmtPrice, fmtVol, navigateMarket } from "../formatters";
import { cardStyle, dashboardTokens } from "../tokens";
import { MiniChart } from "./MiniChart";
import { TradeButton } from "./TradeButton";

const { font, color, layout } = dashboardTokens;

type TrendingPerpCardProps = {
  baseAsset: string;
  price: number;
  change24h: number;
  volume24h: number;
  oi: number;
  symbol?: string;
  isMobile?: boolean;
};

export function TrendingPerpCard({
  baseAsset,
  price,
  change24h,
  volume24h,
  oi,
  symbol,
  isMobile = false,
}: TrendingPerpCardProps) {
  const meta = TRENDING_META[baseAsset] ?? {
    name: baseAsset,
    tag: "CRYPTO",
    tagColor: color.teal,
    tagBg: "rgba(0, 194, 168, 0.2)",
    maxLev: "100X",
  };
  const positive = change24h >= 0;
  const changeColor = positive ? color.green : color.red;
  const marketSymbol = symbol || `${baseAsset}-PERP`;

  return (
    <div
      style={{
        ...cardStyle,
        padding: isMobile ? 18 : 24,
        display: "flex",
        flexDirection: "column",
        height: isMobile ? "auto" : layout.trendingCardHeight,
        minHeight: isMobile ? layout.trendingCardMinHeightMobile : layout.trendingCardHeight,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 400, color: color.muted, fontFamily: font.mono }}>
          {baseAsset} / USDT
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: changeColor, fontFamily: font.mono }}>
          {fmtPct(change24h)}
        </span>
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: color.white,
          fontFamily: font.sans,
          lineHeight: 1.2,
          marginBottom: 6,
        }}
      >
        {meta.name}
      </div>

      <span
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: 18,
          minWidth: 49,
          padding: "0 10px",
          fontSize: 9,
          fontWeight: 700,
          color: meta.tagColor,
          background: meta.tagBg,
          borderRadius: 20,
          letterSpacing: "0.08em",
          marginBottom: 10,
          boxSizing: "border-box",
        }}
      >
        {meta.tag}
      </span>

      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: color.white,
          fontFamily: font.mono,
          lineHeight: 1.1,
          marginBottom: 4,
        }}
      >
        ${fmtPrice(price)}
      </div>

      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: color.muted,
          fontFamily: font.sans,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        UP TO {meta.maxLev} LEVERAGE
      </div>

      <div style={{ flex: 1, marginBottom: 12, minHeight: 0, display: "flex", alignItems: "flex-end" }}>
        <MiniChart symbol={baseAsset} positive={positive} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: color.muted,
                fontFamily: font.sans,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              VOL
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: color.white, fontFamily: font.mono, lineHeight: 1.2 }}>
              {fmtVol(volume24h)}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: color.muted,
                fontFamily: font.sans,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              OI
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: color.white, fontFamily: font.mono, lineHeight: 1.2 }}>
              {fmtVol(oi)}
            </div>
          </div>
        </div>
        <TradeButton onClick={() => navigateMarket(marketSymbol)} iconSize={13} />
      </div>
    </div>
  );
}
