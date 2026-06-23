"use client";

import { memo, useMemo } from "react";
import { dashboardTokens } from "@/components/dashboard/tokens";
import { fmtPct } from "@/components/dashboard/formatters";
import { MARKET_TICKER_LABELS } from "@/config/marketTicker";
import { useMarketTickerPrices, type MarketTickerItem } from "@/hooks/useMarketTickerPrices";

const { font, color } = dashboardTokens;

function formatTickerPrice(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  if (price >= 1) {
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 4 })}`;
}

const TickerItem = memo(function TickerItem({
  label,
  price,
  change,
  positive,
}: {
  label: string;
  price: string;
  change: string | null;
  positive: boolean;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
      <span
        style={{
          color: color.navInactive,
          fontSize: 12,
          fontWeight: 500,
          fontFamily: font.sans,
          letterSpacing: "0.03em",
        }}
      >
        {label}
      </span>
      <span style={{ color: color.white, fontSize: 12, fontWeight: 600, fontFamily: font.sans }}>
        {price}
      </span>
      {change ? (
        <span
          style={{
            color: positive ? color.green : color.red,
            fontSize: 12,
            fontWeight: 500,
            fontFamily: font.sans,
          }}
        >
          {change}
        </span>
      ) : null}
    </span>
  );
});

export default function MarketTicker() {
  const { items } = useMarketTickerPrices();
  const displayItems: MarketTickerItem[] =
    items.length > 0
      ? items
      : MARKET_TICKER_LABELS.map((label) => ({ label, price: 0, change24h: null }));

  const loopItems = useMemo(() => [...displayItems, ...displayItems], [displayItems]);

  return (
    <div
      data-testid="market-ticker"
      className="market-ticker-shell"
      style={{
        background: "transparent",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        height: 34,
        width: "100%",
        overflow: "hidden",
        flexShrink: 0,
        position: "relative",
        zIndex: 1,
        padding: "0 16px",
        boxSizing: "border-box",
      }}
    >
      <div className="market-ticker-track">
        {loopItems.map((item, index) => {
          const hasPrice = item.price > 0;
          const positive = (item.change24h ?? 0) >= 0;
          const change =
            hasPrice && item.change24h != null && Number.isFinite(item.change24h)
              ? fmtPct(item.change24h)
              : null;

          return (
            <div key={`${item.label}-${index}`} className="market-ticker-slot">
              <TickerItem
                label={item.label}
                price={hasPrice ? formatTickerPrice(item.price) : "—"}
                change={change}
                positive={positive}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
