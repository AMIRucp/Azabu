"use client";

import { useEffect, useMemo } from "react";
import { MARKET_TICKER_ASSETS } from "@/config/marketTicker";
import { resolveHyperliquidQuote } from "@/lib/resolveHyperliquidMarket";
import useMarketStore from "@/stores/useMarketStore";

export type MarketTickerItem = {
  label: string;
  price: number;
  change24h: number | null;
};

export function useMarketTickerPrices() {
  const markets = useMarketStore((s) => s.markets);
  const livePrices = useMarketStore((s) => s.livePrices);
  const startPolling = useMarketStore((s) => s.startPolling);

  useEffect(() => startPolling(), [startPolling]);

  const items = useMemo((): MarketTickerItem[] => {
    const results: MarketTickerItem[] = [];

    for (const { label, bases } of MARKET_TICKER_ASSETS) {
      const quote = resolveHyperliquidQuote(bases, markets, livePrices);
      if (!quote) continue;
      results.push({
        label,
        price: quote.price,
        change24h: quote.change24h,
      });
    }

    return results;
  }, [markets, livePrices]);

  return { items };
}
