"use client";

import { dashboardTokens } from "../tokens";
import { useSparklineData } from "@/hooks/useSparklineData";

const { color } = dashboardTokens;

type MiniChartProps = {
  symbol: string;
  positive: boolean;
};

function pricesToPolyline(prices: number[], viewHeight = 32, padding = 3): string {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || max * 0.001 || 1;
  const innerHeight = viewHeight - padding * 2;

  return prices
    .map((price, i) => {
      const x = prices.length === 1 ? 0 : (i / (prices.length - 1)) * 100;
      const y = padding + (1 - (price - min) / range) * innerHeight;
      return `${x},${y}`;
    })
    .join(" ");
}

function placeholderPolyline(positive: boolean): string {
  return Array.from({ length: 28 }, (_, i) => {
    const t = i / 27;
    const y = positive ? 24 - t * 10 : 14 + t * 10;
    return `${t * 100},${y}`;
  }).join(" ");
}

export function MiniChart({ symbol, positive }: MiniChartProps) {
  const prices = useSparklineData(symbol);
  const live = prices && prices.length >= 2;
  const trendUp = live ? prices[prices.length - 1] >= prices[0] : positive;
  const strokeColor = trendUp ? color.green : color.red;
  const points = live ? pricesToPolyline(prices) : placeholderPolyline(positive);
  const gradId = `cg-${symbol}`;

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" style={{ width: "100%", height: 48, display: "block", opacity: live ? 1 : 0.45 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,32 ${points} 100,32`} fill={`url(#${gradId})`} />
      <polyline points={points} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
