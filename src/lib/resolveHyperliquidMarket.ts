import type { UnifiedMarket } from "@/types/market";

export type HyperliquidLivePrice = {
  price: number;
  change24h: number;
  vol24h?: number;
  openInterest?: number;
  fundingRate?: number;
};

function livePriceKeys(market: UnifiedMarket): string[] {
  const { baseAsset, symbol } = market;
  return [symbol, `${baseAsset}-USDC`, `${baseAsset}-PERP`, `${baseAsset}-USDT`, `${baseAsset}USDT`, baseAsset];
}

export function applyLiveQuote(
  market: UnifiedMarket,
  livePrices: Record<string, HyperliquidLivePrice>,
): UnifiedMarket {
  for (const key of livePriceKeys(market)) {
    const live = livePrices[key];
    if (live?.price > 0) {
      return {
        ...market,
        price: live.price,
        change24h: live.change24h,
        volume24h: live.vol24h ?? market.volume24h,
        openInterest: live.openInterest ?? market.openInterest,
      };
    }
  }
  return market;
}

export function getHyperliquidPerps(
  markets: UnifiedMarket[],
  livePrices: Record<string, HyperliquidLivePrice>,
): UnifiedMarket[] {
  return markets
    .filter((m) => m.protocol === "hyperliquid" && m.type === "perp" && m.price > 0)
    .map((m) => applyLiveQuote(m, livePrices));
}

export function resolveHyperliquidQuote(
  bases: readonly string[],
  markets: UnifiedMarket[],
  livePrices: Record<string, HyperliquidLivePrice>,
): { price: number; change24h: number } | null {
  for (const base of bases) {
    const market = markets.find(
      (m) => m.baseAsset === base && m.protocol === "hyperliquid" && m.type === "perp" && m.price > 0,
    );
    if (!market) continue;
    const live = applyLiveQuote(market, livePrices);
    return { price: live.price, change24h: live.change24h };
  }
  return null;
}
