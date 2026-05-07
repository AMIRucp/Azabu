"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import type { UnifiedMarket } from "@/types/market";
import { deduplicateMarkets, getDedupId, type DeduplicatedMarket } from "@/services/marketDeduplicator";

const FAVORITES_KEY = "afx_perps_favorites";

const HL_PROTOCOLS = new Set(["hyperliquid"]);

export type CategoryFilter = "All" | "Favorites" | "Majors" | "Meme" | "DeFi" | "L1/L2" | "Indices" | "Stocks" | "Commodities" | "Forex";
export type ChainFilter = "all" | "cross" | "hyperliquid";
export type CollateralFilter = "all" | "USDT" | "USDC";
export type SortKey = "market" | "volume" | "oi" | "price" | "change" | "funding" | "leverage" | "alpha";

export const CATEGORIES: CategoryFilter[] = [
  "Favorites", "All", "Majors", "Meme", "DeFi", "L1/L2", "Stocks", "Commodities", "Indices", "Forex",
];

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveFavorites(fav: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...fav]));
}

function matchesCategory(m: UnifiedMarket, cat: CategoryFilter): boolean {
  if (cat === "All") return true;
  if (cat === "Favorites") return false;
  if (cat === "Majors") {
    const majors = new Set(["BTC","ETH","SOL","BNB","XRP","AVAX","ADA","DOGE","LTC","DOT","TRX","XLM","ATOM","NEAR","ALGO","ICP","BCH","TON"]);
    return majors.has(m.baseAsset);
  }
  if (cat === "Meme") return m.category === "meme";
  if (cat === "DeFi") return m.category === "defi";
  if (cat === "L1/L2") return m.category === "l1l2";
  if (cat === "Indices") return m.category === "index";
  if (cat === "Stocks") return m.category === "stock";
  if (cat === "Commodities") return m.category === "commodity";
  if (cat === "Forex") return m.category === "forex";
  return true;
}

export function applyLivePrices(
  markets: UnifiedMarket[],
  livePrices?: Record<string, { price: number; change24h: number; vol24h?: number; openInterest?: number; fundingRate?: number }>
): UnifiedMarket[] {
  if (!livePrices || Object.keys(livePrices).length === 0) return markets;
  return markets.map(m => {
    const live = livePrices[m.symbol] || livePrices[m.baseAsset];
    if (!live) return m;
    return {
      ...m,
      price: live.price || m.price,
      change24h: live.change24h ?? m.change24h,
      volume24h: live.vol24h ?? m.volume24h,
      openInterest: live.openInterest ?? m.openInterest,
      fundingRate: live.fundingRate ?? m.fundingRate,
    };
  });
}

interface UseMarketListOptions {
  allMarkets: UnifiedMarket[];
  livePrices?: Record<string, { price: number; change24h: number; vol24h?: number; openInterest?: number; fundingRate?: number }>;
  typeFilter?: "perp" | "spot" | "all";
  defaultSortKey?: SortKey;
  defaultCategory?: CategoryFilter;
  defaultChainFilter?: ChainFilter;
  defaultCollateralFilter?: CollateralFilter;
}

export function useMarketList({
  allMarkets,
  livePrices,
  typeFilter = "perp",
  defaultSortKey = "volume",
  defaultCategory = "All",
  defaultChainFilter = "all",
  defaultCollateralFilter = "all",
}: UseMarketListOptions) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>(defaultCategory);
  const [chainFilter, setChainFilter] = useState<ChainFilter>(defaultChainFilter);
  const [collateralFilter, setCollateralFilter] = useState<CollateralFilter>(defaultCollateralFilter);
  const [sortKey, setSortKey] = useState<SortKey>(defaultSortKey);
  const [sortAsc, setSortAsc] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [kbIdx, setKbIdx] = useState(-1);

  useEffect(() => { setFavorites(loadFavorites()); }, []);

  const toggleFav = useCallback((dedupKey: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(dedupKey)) next.delete(dedupKey); else next.add(dedupKey);
      saveFavorites(next);
      return next;
    });
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) { setSortAsc(a => !a); return key; }
      setSortAsc(false);
      return key;
    });
  }, []);

  const marketsWithLive = useMemo(() => {
    let perps = allMarkets;
    if (typeFilter !== "all") {
      perps = perps.filter(m => m.type === typeFilter);
    }
    return applyLivePrices(perps, livePrices);
  }, [allMarkets, livePrices, typeFilter]);

  const deduplicated = useMemo(() => {
    return deduplicateMarkets(marketsWithLive);
  }, [marketsWithLive]);

  const filtered = useMemo(() => {
    let list = deduplicated;

    if (category === "Favorites") {
      list = list.filter(d => favorites.has(getDedupId(d)));
    } else {
      list = list.filter(d => matchesCategory(d.primary, category));
    }

    if (chainFilter !== "all") {
      list = list.filter(d => {
        const allVenues = [d.primary, ...d.alternatives];
        if (chainFilter === "hyperliquid") {
          return allVenues.some(m => HL_PROTOCOLS.has(m.protocol));
        }
        const hasCross = allVenues.some(m => !HL_PROTOCOLS.has(m.protocol));
        return hasCross;
      });
    }

    if (collateralFilter !== "all") {
      list = list.filter(d => {
        const allVenues = [d.primary, ...d.alternatives];
        return allVenues.some(m => (m.quoteAsset || "USDC").toUpperCase() === collateralFilter);
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(d => {
        const allVenues = [d.primary, ...d.alternatives];
        return allVenues.some(m =>
          m.symbol.toLowerCase().includes(q) ||
          m.baseAsset.toLowerCase().includes(q) ||
          d.normalizedBase.toLowerCase().includes(q) ||
          (m.name || "").toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [deduplicated, category, favorites, search, chainFilter, collateralFilter]);

  const sorted = useMemo(() => {
    const dir = sortAsc ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const aFav = favorites.has(getDedupId(a)) ? 1 : 0;
      const bFav = favorites.has(getDedupId(b)) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;

      switch (sortKey) {
        case "market":
        case "alpha":
          return dir * a.primary.baseAsset.localeCompare(b.primary.baseAsset);
        case "volume": 
          return dir * ((b.primary.volume24h || 0) - (a.primary.volume24h || 0));
        case "oi": 
          return dir * ((b.primary.openInterest || 0) - (a.primary.openInterest || 0));
        case "price": return dir * ((b.primary.price || 0) - (a.primary.price || 0));
        case "change": return dir * ((b.primary.change24h || 0) - (a.primary.change24h || 0));
        case "funding": return dir * (Math.abs(b.bestFundingRate || 0) - Math.abs(a.bestFundingRate || 0));
        case "leverage": return dir * ((b.primary.maxLeverage || 0) - (a.primary.maxLeverage || 0));
        default: return 0;
      }
    });
  }, [filtered, sortKey, sortAsc, favorites]);

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent,
    onSelect: (sym: string, proto?: string, meta?: { category?: string; baseAsset?: string }) => void,
  ) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setKbIdx(prev => Math.min(prev + 1, sorted.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setKbIdx(prev => Math.max(prev - 1, 0)); }
    else if (e.key === "Enter" && kbIdx >= 0 && sorted[kbIdx]) {
      e.preventDefault();
      const m = sorted[kbIdx].primary;
      onSelect(m.symbol, m.protocol, { category: m.category, baseAsset: m.baseAsset });
    }
    else if (e.key === "Escape") { setSearch(""); setKbIdx(-1); }
  }, [sorted, kbIdx]);

  return {
    search, setSearch,
    category, setCategory,
    chainFilter, setChainFilter,
    collateralFilter, setCollateralFilter,
    sortKey, sortAsc, handleSort,
    favorites, toggleFav,
    kbIdx, setKbIdx,
    sorted,
    deduplicated,
    handleKeyDown,
    totalCount: deduplicated.length,
  };
}
