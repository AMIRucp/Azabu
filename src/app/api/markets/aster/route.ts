import { NextResponse } from "next/server";
import type { UnifiedMarket } from "@/types/market";

const ASTER_BASE = "https://fapi.asterdex.com";
const CACHE_TTL = 30 * 1000;

interface CacheEntry {
  data: any;
  ts: number;
}

const g = globalThis as typeof globalThis & {
  _asterMarketsCache?: CacheEntry;
};

if (!g._asterMarketsCache) {
  g._asterMarketsCache = { data: null, ts: 0 };
}

interface AsterTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
  openPrice: string;
}

interface AsterPremiumIndex {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
}

interface AsterSymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  contractType: string;
  requiredMarginPercent: string;
  filters: Array<{
    filterType: string;
    maxPrice?: string;
    minPrice?: string;
    tickSize?: string;
    maxQty?: string;
    minQty?: string;
    stepSize?: string;
    limit?: number;
    notional?: string;
    multiplierUp?: string;
    multiplierDown?: string;
  }>;
}

async function fetchAsterMarkets(): Promise<UnifiedMarket[]> {
  const [tickersRes, premiumRes, exchangeRes] = await Promise.all([
    fetch(`${ASTER_BASE}/fapi/v3/ticker/24hr`, { next: { revalidate: 0 } }),
    fetch(`${ASTER_BASE}/fapi/v3/premiumIndex`, { next: { revalidate: 0 } }),
    fetch(`${ASTER_BASE}/fapi/v3/exchangeInfo`, { next: { revalidate: 0 } }),
  ]);

  if (!tickersRes.ok || !premiumRes.ok || !exchangeRes.ok) {
    throw new Error("Failed to fetch Aster market data");
  }

  const tickers: AsterTicker[] = await tickersRes.json();
  const premiums: AsterPremiumIndex[] = await premiumRes.json();
  const exchangeInfo = await exchangeRes.json();

  const premiumMap = new Map<string, AsterPremiumIndex>();
  for (const p of premiums) {
    premiumMap.set(p.symbol, p);
  }

  const symbolInfoMap = new Map<string, AsterSymbolInfo>();
  for (const s of (exchangeInfo.symbols || []) as AsterSymbolInfo[]) {
    symbolInfoMap.set(s.symbol, s);
  }

  const markets: UnifiedMarket[] = [];

  for (const ticker of tickers) {
    const symbol = ticker.symbol;
    if (!symbol.endsWith("USDT")) continue;

    const symbolInfo = symbolInfoMap.get(symbol);
    if (!symbolInfo || symbolInfo.status !== "TRADING") continue;

    const premium = premiumMap.get(symbol);
    const baseAsset = symbolInfo.baseAsset;
    const pairSymbol = `${baseAsset}-USDT`;

    const lastPrice = parseFloat(ticker.lastPrice);
    const openPrice = parseFloat(ticker.openPrice);
    const change24h = openPrice > 0 ? ((lastPrice - openPrice) / openPrice) * 100 : parseFloat(ticker.priceChangePercent);
    const volume24h = parseFloat(ticker.quoteVolume);

    if (volume24h === 0) continue;

    const markPrice = premium ? parseFloat(premium.markPrice) : lastPrice;
    const indexPrice = premium ? parseFloat(premium.indexPrice) : undefined;
    const fundingRate = premium ? parseFloat(premium.lastFundingRate) * 100 : 0;

    let maxLeverage = 50;
    const reqMargin = parseFloat(symbolInfo.requiredMarginPercent);
    if (reqMargin > 0) {
      maxLeverage = Math.round(100 / reqMargin);
    }

    markets.push({
      id: `aster-${symbol.toLowerCase()}`,
      protocol: "aster" as const,
      chain: "arbitrum" as const,
      type: "perp" as const,
      symbol: pairSymbol,
      baseAsset,
      quoteAsset: "USDT",
      price: lastPrice,
      change24h,
      volume24h,
      openInterest: 0,
      fundingRate,
      maxLeverage,
      markPrice,
      indexPrice,
      name: symbol,
      isMarketOpen: true,
    } as UnifiedMarket);
  }

  markets.sort((a, b) => b.volume24h - a.volume24h);

  return markets;
}

export async function GET() {
  try {
    const cached = g._asterMarketsCache;
    const now = Date.now();

    if (cached && cached.data && now - cached.ts < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Cache": "HIT",
        },
      });
    }

    const markets = await fetchAsterMarkets();

    const response = {
      success: true,
      markets,
      total: markets.length,
      timestamp: now,
    };

    g._asterMarketsCache = { data: response, ts: now };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    const cached = g._asterMarketsCache;
    if (cached && cached.data) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Cache": "STALE",
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch Aster markets",
        details: error instanceof Error ? error.message : "Unknown error",
        markets: [],
        total: 0,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
