"use client";

import { useEffect, useState } from "react";
import { fetchHyperliquidCandles } from "@/services/candleService";

const CACHE_TTL = 60_000;
const POINT_COUNT = 28;

const cache = new Map<string, { prices: number[]; ts: number }>();

export function useSparklineData(symbol: string) {
  const [prices, setPrices] = useState<number[] | null>(() => {
    const cached = cache.get(symbol.toUpperCase());
    return cached && Date.now() - cached.ts < CACHE_TTL ? cached.prices : null;
  });

  useEffect(() => {
    const key = symbol.toUpperCase();
    let cancelled = false;

    async function load() {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setPrices(cached.prices);
        return;
      }

      const result = await fetchHyperliquidCandles(key, "1H");
      if (cancelled || !result?.candles.length) return;

      const closes = result.candles.map((c) => c.close).filter((p) => p > 0).slice(-POINT_COUNT);
      if (closes.length < 2) return;

      cache.set(key, { prices: closes, ts: Date.now() });
      setPrices(closes);
    }

    load();
    const iv = setInterval(load, CACHE_TTL);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [symbol]);

  return prices;
}
