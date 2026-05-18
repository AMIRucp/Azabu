import { NextResponse } from "next/server";
import { HttpTransport, InfoClient, SubscriptionClient, WebSocketTransport } from "@nktkas/hyperliquid";
import type { UnifiedMarket } from "@/types/market";

const ASTER_BASE = "https://fapi.asterdex.com";
const CACHE_TTL = 30 * 1000;

interface CacheEntry {
  data: any;
  ts: number;
}

const g = globalThis as typeof globalThis & {
  _unifiedMarketsCache_v3?: CacheEntry;
  _wsSubscription?: SubscriptionClient;
  _livePrices?: Map<string, { price: number; timestamp: number }>;
  _wsInitialized?: boolean;
};

if (!g._unifiedMarketsCache_v3) {
  g._unifiedMarketsCache_v3 = { data: null, ts: 0 };
}

if (!g._livePrices) {
  g._livePrices = new Map();
}

async function initWebSocketSubscription() {
  if (g._wsInitialized) return;
  g._wsInitialized = true;

  try {
    const transport = new WebSocketTransport();
    const subs = new SubscriptionClient({ transport });

    await subs.allMids((data) => {
      if (!g._livePrices) g._livePrices = new Map();
      
      Object.entries(data).forEach(([coin, priceStr]) => {
        g._livePrices!.set(coin, {
          price: parseFloat(priceStr as string),
          timestamp: Date.now(),
        });
      });
    });

    g._wsSubscription = subs;
  } catch (error) {
    g._wsInitialized = false;
  }
}

initWebSocketSubscription();

async function fetchAsterMarkets(): Promise<UnifiedMarket[]> {
  const [tickersRes, premiumRes, exchangeRes] = await Promise.all([
    fetch(`${ASTER_BASE}/fapi/v3/ticker/24hr`),
    fetch(`${ASTER_BASE}/fapi/v3/premiumIndex`),
    fetch(`${ASTER_BASE}/fapi/v3/exchangeInfo`),
  ]);

  if (!tickersRes.ok || !premiumRes.ok || !exchangeRes.ok) {
    throw new Error("Failed to fetch Aster market data");
  }

  const tickers: Array<{
    symbol: string; priceChange: string; priceChangePercent: string;
    lastPrice: string; volume: string; quoteVolume: string;
    highPrice: string; lowPrice: string; openPrice: string;
  }> = await tickersRes.json();

  const premiums: Array<{
    symbol: string; markPrice: string; indexPrice: string;
    lastFundingRate: string; nextFundingTime: number;
  }> = await premiumRes.json();

  const exchangeInfo = await exchangeRes.json();

  const premiumMap = new Map(premiums.map(p => [p.symbol, p]));
  const symbolInfoMap = new Map(
    (exchangeInfo.symbols || []).map((s: any) => [s.symbol, s])
  );

  const markets: UnifiedMarket[] = [];

  for (const ticker of tickers) {
    const { symbol } = ticker;
    if (!symbol.endsWith("USDT")) continue;

    const symbolInfo = symbolInfoMap.get(symbol) as any;
    if (!symbolInfo || symbolInfo.status !== "TRADING") continue;

    const premium = premiumMap.get(symbol);
    const baseAsset = symbolInfo.baseAsset as string;
    const lastPrice = parseFloat(ticker.lastPrice);
    const openPrice = parseFloat(ticker.openPrice);
    const change24h = openPrice > 0
      ? ((lastPrice - openPrice) / openPrice) * 100
      : parseFloat(ticker.priceChangePercent);
    const volume24h = parseFloat(ticker.quoteVolume);

    if (volume24h === 0) continue;

    const markPrice = premium ? parseFloat(premium.markPrice) : lastPrice;
    const indexPrice = premium ? parseFloat(premium.indexPrice) : undefined;
    const fundingRate = premium ? parseFloat(premium.lastFundingRate) * 100 : 0;

    const reqMargin = parseFloat(symbolInfo.requiredMarginPercent || "2");
    const maxLeverage = reqMargin > 0 ? Math.round(100 / reqMargin) : 50;

    markets.push({
      id: `aster-${symbol.toLowerCase()}`,
      protocol: "aster" as const,
      chain: "arbitrum" as const,
      type: "perp" as const,
      symbol: `${baseAsset}-USDT`,
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

async function fetchHyperliquidMarkets(): Promise<UnifiedMarket[]> {
  const transport = new HttpTransport();
  const info = new InfoClient({ transport });

  const perpMeta = await info.meta();
  const perpCtxs = await info.metaAndAssetCtxs();
  const spotData = await info.spotMetaAndAssetCtxs();
  const spotMeta = spotData[0];
  const spotAssetCtxs = spotData[1];

  const perpPairs = perpMeta.universe
    .map((perp, index) => {
      const ctx = perpCtxs[1][index];
      const volume = parseFloat(ctx.dayNtlVlm || "0");
      if (volume === 0) return null;

      const baseAsset = perp.name.replace(/-PERP$/i, "").replace(/PERP$/i, "");
      const pairSymbol = `${baseAsset}-USDC`;
      
      const livePrice = g._livePrices?.get(perp.name);
      const markPrice = livePrice?.price || parseFloat(ctx.markPx);
      const prevPrice = parseFloat(ctx.prevDayPx);
      const change24h = prevPrice > 0 ? ((markPrice - prevPrice) / prevPrice) * 100 : 0;
      
      const maxLeverage = perp.maxLeverage || 50;

      return {
        id: `hyperliquid-${perp.name.toLowerCase()}`,
        protocol: "hyperliquid" as const,
        chain: "hyperliquid" as const,
        type: "perp" as const,
        symbol: pairSymbol,
        baseAsset: baseAsset,
        quoteAsset: "USDC",
        price: markPrice,
        change24h: change24h,
        volume24h: volume,
        openInterest: parseFloat(ctx.openInterest) || 0,
        fundingRate: parseFloat(ctx.funding) * 100 || 0,
        maxLeverage: maxLeverage,
        markPrice: markPrice,
        indexPrice: ctx.midPx ? parseFloat(ctx.midPx) : undefined,
        name: perp.name,
        isMarketOpen: true,
        assetId: index,
        szDecimals: perp.szDecimals,
      } as UnifiedMarket;
    })
    .filter((p): p is UnifiedMarket => p !== null);

  const spotPairs = spotMeta.universe
    .map((pair) => {
      const ctx = spotAssetCtxs[pair.index];
      const volume = parseFloat(ctx.dayNtlVlm || "0");
      if (volume === 0) return null;

      const token0 = spotMeta.tokens[pair.tokens[0]];
      const token1 = spotMeta.tokens[pair.tokens[1]];
      const baseAsset = token0?.name || "?";
      const quoteAsset = token1?.name || "USDC";
      const pairSymbol = `${baseAsset}-${quoteAsset}`;

      const spotCoin = `${baseAsset}/${quoteAsset}`;
      const livePrice = g._livePrices?.get(spotCoin);
      const markPrice = livePrice?.price || parseFloat(ctx.markPx);
      const prevPrice = parseFloat(ctx.prevDayPx);
      const change24h = prevPrice > 0 ? ((markPrice - prevPrice) / prevPrice) * 100 : 0;

      return {
        id: `hyperliquid-spot-${baseAsset.toLowerCase()}`,
        protocol: "hyperliquid" as const,
        chain: "hyperliquid" as const,
        type: "spot" as const,
        symbol: pairSymbol,
        baseAsset: baseAsset,
        quoteAsset: quoteAsset,
        price: markPrice,
        change24h: change24h,
        volume24h: volume,
        markPrice: markPrice,
        indexPrice: ctx.midPx ? parseFloat(ctx.midPx) : undefined,
        name: pairSymbol,
        isMarketOpen: true,
        assetId: pair.index,
        szDecimals: token0?.szDecimals,
      } as UnifiedMarket;
    })
    .filter((p): p is UnifiedMarket => p !== null);

  const allPairs = [...perpPairs, ...spotPairs];
  allPairs.sort((a, b) => b.volume24h - a.volume24h);

  return allPairs;
}

export async function GET() {
  try {
    const cached = g._unifiedMarketsCache_v3;
    const now = Date.now();
    
    if (cached && cached.data && now - cached.ts < CACHE_TTL) {
      const markets = cached.data.markets.map((m: UnifiedMarket) => {
        const livePrice = m.name ? g._livePrices?.get(m.name) : undefined;
        if (livePrice) {
          const prevDayPrice = m.price / (1 + m.change24h / 100);
          const newChange24h = prevDayPrice > 0 ? ((livePrice.price - prevDayPrice) / prevDayPrice) * 100 : m.change24h;
          
          return {
            ...m,
            price: livePrice.price,
            markPrice: livePrice.price,
            change24h: newChange24h,
          };
        }
        return m;
      });

      return NextResponse.json(
        { 
          success: true,
          markets, 
          total: markets.length,
          timestamp: now,
          livePriceCount: g._livePrices?.size || 0,
          wsConnected: !!g._wsSubscription,
        },
        {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-Cache": "HIT-LIVE",
          },
        }
      );
    }

    const [hlMarkets, asterMarkets] = await Promise.allSettled([
      fetchHyperliquidMarkets(),
      fetchAsterMarkets(),
    ]);

    const markets = [
      ...(hlMarkets.status === "fulfilled" ? hlMarkets.value : []),
      ...(asterMarkets.status === "fulfilled" ? asterMarkets.value : []),
    ];
    markets.sort((a, b) => b.volume24h - a.volume24h);

    const response = {
      success: true,
      markets,
      total: markets.length,
      timestamp: Date.now(),
      livePriceCount: g._livePrices?.size || 0,
      wsConnected: !!g._wsSubscription,
    };

    g._unifiedMarketsCache_v3 = { data: response, ts: Date.now() };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    const cached = g._unifiedMarketsCache_v3;
    if (cached && cached.data) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Cache": "STALE",
        },
      });
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch markets",
        details: errorMessage,
        markets: [],
        total: 0,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
