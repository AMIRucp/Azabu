"use client";

import { create } from "zustand";
import type { UnifiedMarket } from "@/types/market";
import { deduplicateMarkets, type DeduplicatedMarket } from "@/services/marketDeduplicator";

type LivePrice = {
  price: number;
  change24h: number;
  vol24h?: number;
  openInterest?: number;
  fundingRate?: number;
};

interface MarketStoreState {
  markets: UnifiedMarket[];
  deduplicated: DeduplicatedMarket[];
  livePrices: Record<string, LivePrice>;
  lastFetched: number;
  isLoading: boolean;
  hasLoaded: boolean;
}

interface MarketStoreActions {
  fetchMarkets: () => Promise<void>;
  startPolling: () => () => void;
}

let inFlightFetch: Promise<void> | null = null;
let pollCleanup: (() => void) | null = null;
let pollCount = 0;

const POLL_INTERVAL = 30_000;

const useMarketStore = create<MarketStoreState & MarketStoreActions>((set, get) => ({
  markets: [],
  deduplicated: [],
  livePrices: {},
  lastFetched: 0,
  isLoading: false,
  hasLoaded: false,

  fetchMarkets: async () => {
    if (inFlightFetch) {
      await inFlightFetch;
      return;
    }

    const doFetch = async () => {
      set({ isLoading: true });
      try {
        const res = await fetch("/api/markets/unified");
        if (!res.ok) {
          set({ isLoading: false });
          return;
        }
        const data = await res.json();
        if (!data.markets) {
          set({ isLoading: false });
          return;
        }

        const prices: Record<string, LivePrice> = {};
        for (const m of data.markets as UnifiedMarket[]) {
          if (m.price > 0) {
            prices[m.symbol] = {
              price: m.price,
              change24h: m.change24h ?? 0,
              vol24h: m.volume24h ?? 0,
              openInterest: m.openInterest ?? 0,
              fundingRate: m.fundingRate ?? 0,
            };
          }
        }

        const deduped = deduplicateMarkets(data.markets);
        set({
          markets: data.markets,
          deduplicated: deduped,
          livePrices: prices,
          lastFetched: Date.now(),
          isLoading: false,
          hasLoaded: true,
        });
      } catch {
        set({ isLoading: false });
      }
    };

    inFlightFetch = doFetch();
    try {
      await inFlightFetch;
    } finally {
      inFlightFetch = null;
    }
  },

  startPolling: () => {
    pollCount++;
    if (pollCount === 1) {
      const { fetchMarkets, hasLoaded } = get();
      if (!hasLoaded) fetchMarkets();

      const iv = setInterval(() => {
        get().fetchMarkets();
      }, POLL_INTERVAL);

      pollCleanup = () => clearInterval(iv);
    }

    return () => {
      pollCount--;
      if (pollCount <= 0) {
        pollCount = 0;
        pollCleanup?.();
        pollCleanup = null;
      }
    };
  },
}));

export default useMarketStore;
