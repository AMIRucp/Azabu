"use client";

import { useMemo, memo } from "react";
import useMarketStore from "@/stores/useMarketStore";
import { getIconWithJupiter } from "@/config/tokenIcons";
import { useJupiterLogos } from "@/hooks/useJupiterLogos";
import type { UnifiedMarket } from "@/types/market";

const MONO = "'JetBrains Mono', 'SF Mono', monospace";

const TICKER_SPECS: { label: string; icon: string; match: (m: UnifiedMarket) => boolean }[] = [
  { label: "BTC", icon: "BTC", match: m => m.baseAsset === "BTC" && m.type === "perp" },
  { label: "ETH", icon: "ETH", match: m => m.baseAsset === "ETH" && m.type === "perp" },
  { label: "SOL", icon: "SOL", match: m => m.baseAsset === "SOL" && m.type === "perp" },
  { label: "XRP", icon: "XRP", match: m => m.baseAsset === "XRP" && m.type === "perp" },
  { label: "DOGE", icon: "DOGE", match: m => m.baseAsset === "DOGE" && m.type === "perp" },
  { label: "LINK", icon: "LINK", match: m => m.baseAsset === "LINK" && m.type === "perp" },
  { label: "BNB", icon: "BNB", match: m => m.baseAsset === "BNB" && m.type === "perp" },
  { label: "AAPL", icon: "AAPL", match: m => m.baseAsset === "AAPL" },
  { label: "NVDA", icon: "NVDA", match: m => m.baseAsset === "NVDA" },
  { label: "TSLA", icon: "TSLA", match: m => m.baseAsset === "TSLA" },
  { label: "AMZN", icon: "AMZN", match: m => m.baseAsset === "AMZN" },
  { label: "GOOG", icon: "GOOG", match: m => m.baseAsset === "GOOG" || m.baseAsset === "GOOGL" },
  { label: "GOLD", icon: "XAU", match: m => m.baseAsset === "XAU" },
  { label: "OIL", icon: "WTI", match: m => m.baseAsset === "CL" || m.baseAsset === "WTI" },
  { label: "EUR/USD", icon: "EURUSD", match: m => m.baseAsset === "EURUSD" || m.symbol === "EUR/USD" },
  { label: "USD/JPY", icon: "USDJPY", match: m => m.baseAsset === "USDJPY" || m.symbol === "USD/JPY" },
];

function pickBest(markets: UnifiedMarket[], match: (m: UnifiedMarket) => boolean): UnifiedMarket | null {
  let best: UnifiedMarket | null = null;
  let bestScore = -1;
  for (const m of markets) {
    if (!match(m) || m.price <= 0) continue;
    const hasChange = m.change24h !== 0 ? 2 : 0;
    const vol = Math.log10(Math.max(m.volume24h || 1, 1));
    const score = hasChange * 100 + vol;
    if (score > bestScore) { best = m; bestScore = score; }
  }
  return best;
}

function formatTickerPrice(price: number): string {
  if (price === 0) return "--";
  if (price >= 10000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (price >= 100) return price.toFixed(2);
  if (price >= 1) return price.toFixed(3);
  return price.toFixed(4);
}

function TickerIcon({ symbol }: { symbol: string }) {
  const jupiterLogos = useJupiterLogos();
  const icon = getIconWithJupiter(symbol, jupiterLogos);
  if (icon.type === "img") {
    return (
      <img
        src={icon.value}
        alt={symbol}
        width={14}
        height={14}
        style={{ borderRadius: "50%", flexShrink: 0, background: "rgba(255,255,255,0.06)" }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  if (icon.type === "emoji") {
    return (
      <span style={{ fontSize: 10, lineHeight: 1, flexShrink: 0 }}>{icon.value}</span>
    );
  }
  return null;
}

type TickerData = { label: string; icon: string; price: number; change: number; hasChangeData: boolean };

const TickerItem = memo(function TickerItem({ item }: { item: TickerData }) {
  const { label, icon, price, change, hasChangeData } = item;
  const changeColor = change > 0 ? "#22C55E" : change < 0 ? "#EF4444" : "#6B7280";
  const changeStr = `${change > 0 ? "+" : ""}${change.toFixed(2)}%`;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "0 18px",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <TickerIcon symbol={icon} />
      <span style={{ color: "#6F7785", fontSize: 10, fontWeight: 600, fontFamily: MONO }}>{label}</span>
      <span style={{ color: "#D4D4D8", fontSize: 10, fontWeight: 700, fontFamily: MONO }}>
        {formatTickerPrice(price)}
      </span>
      {hasChangeData ? (
        <span
          style={{
            color: changeColor,
            fontSize: 9,
            fontWeight: 700,
            fontFamily: MONO,
            padding: "1px 4px",
            borderRadius: 3,
            background: change !== 0 ? `${changeColor}12` : "transparent",
          }}
        >
          {changeStr}
        </span>
      ) : null}
    </div>
  );
});

export default function MarketTicker() {
  const markets = useMarketStore((s) => s.markets);
  const hasLoaded = useMarketStore((s) => s.hasLoaded);

  const items: TickerData[] = useMemo(() => {
    if (!markets.length) return [];
    return TICKER_SPECS
      .map((spec) => {
        const best = pickBest(markets, spec.match);
        if (!best) return null;
        const change = best.change24h || 0;
        const hasChangeData = change !== 0 || best.isMarketOpen === true;
        return {
          label: spec.label,
          icon: spec.icon,
          price: best.price,
          change,
          hasChangeData,
        };
      })
      .filter((x): x is TickerData => x !== null);
  }, [markets]);

  if (!hasLoaded || items.length === 0) return null;

  return (
    <div
      data-testid="market-ticker"
      style={{
        overflow: "hidden",
        background: "#060608",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        height: 28,
        display: "flex",
        alignItems: "center",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 40,
          background: "linear-gradient(to right, #060608, transparent)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 40,
          background: "linear-gradient(to left, #060608, transparent)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          animation: "tickerScroll 45s linear infinite",
          willChange: "transform",
        }}
      >
        {items.map((item, i) => (
          <TickerItem key={`a-${i}`} item={item} />
        ))}
        {items.map((item, i) => (
          <TickerItem key={`b-${i}`} item={item} />
        ))}
      </div>
      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
