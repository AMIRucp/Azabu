"use client";

import { TokenLogo } from "@/components/TokenLogo";
import { getHyperliquidCoinLogo } from "@/config/tokenIcons";
import type { UnifiedPosition } from "@/stores/usePositionStore";
import { fmtPrice, fmtUsd, navigateMarket } from "../formatters";
import { cardStyle, dashboardTokens } from "../tokens";

const { font, color, layout } = dashboardTokens;

function SideBadge({ side, leverage }: { side: "LONG" | "SHORT"; leverage: number }) {
  const badgeColor = side === "LONG" ? color.green : color.shortBadge;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 66,
        height: 23,
        padding: 0,
        fontSize: 10,
        fontWeight: 500,
        fontFamily: font.sans,
        color: badgeColor,
        background: side === "LONG" ? "rgba(148, 255, 187, 0.1)" : "rgba(255, 131, 131, 0.1)",
        borderRadius: 20,
        letterSpacing: "0.02em",
        boxSizing: "border-box",
        flexShrink: 0,
      }}
    >
      {side} {leverage}x
    </span>
  );
}

type OpenPositionCardProps = {
  position: UnifiedPosition;
};

function positionLogoSrc(position: UnifiedPosition): string | undefined {
  if (position.protocol === "hyperliquid") {
    return getHyperliquidCoinLogo(position.baseAsset);
  }
  return undefined;
}

export function OpenPositionCard({ position }: OpenPositionCardProps) {
  const pnlColor = position.unrealizedPnl >= 0 ? color.green : color.red;
  const symbol = `${position.baseAsset}-PERP`;

  return (
    <div
      style={{
        ...cardStyle,
        padding: 24,
        height: layout.openPositionCardHeight,
        boxSizing: "border-box",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
      onClick={() => navigateMarket(symbol)}
      data-testid={`dashboard-position-${position.baseAsset}`}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <TokenLogo symbol={position.baseAsset} src={positionLogoSrc(position)} size={32} />
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: color.white,
                fontFamily: font.sans,
                lineHeight: 1.2,
              }}
            >
              {symbol}
            </div>
          </div>
          <SideBadge side={position.side} leverage={position.leverage} />
        </div>

        <div
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: color.label,
            fontFamily: font.sans,
            lineHeight: "15px",
            letterSpacing: 0,
          }}
        >
          Entry ${fmtPrice(position.entryPrice)} · Mark ${fmtPrice(position.markPrice)}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: pnlColor,
            fontFamily: font.sans,
            lineHeight: 1,
          }}
        >
          {fmtUsd(position.unrealizedPnl, { signed: true })}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: color.muted,
            fontFamily: font.sans,
            lineHeight: 1.3,
            flexShrink: 0,
          }}
        >
          {fmtUsd(position.sizeUsd, { compact: true })} size
        </div>
      </div>
    </div>
  );
}
