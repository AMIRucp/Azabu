import { hlInfoPost } from './hlClient';

export interface HlPerpMeta {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
  isDelisted?: boolean;
}

export interface HlAssetCtx {
  prevDayPx: string;
  dayNtlVlm: string;
  markPx: string;
  midPx: string | null;
  funding: string;
  openInterest: string;
  oraclePx: string;
}

export interface HlMarketData {
  meta: { universe: HlPerpMeta[] };
  assetCtxs: HlAssetCtx[];
  mids: Record<string, string>;
}

let cachedData: { data: HlMarketData; ts: number } | null = null;
const CACHE_TTL = 15_000;

export async function fetchHyperliquidMarkets(): Promise<HlMarketData> {
  if (cachedData && Date.now() - cachedData.ts < CACHE_TTL) {
    return cachedData.data;
  }

  const [metaAndCtxs, mids] = await Promise.all([
    hlInfoPost({ type: 'metaAndAssetCtxs' }) as Promise<[{ universe: HlPerpMeta[] }, HlAssetCtx[]]>,
    hlInfoPost({ type: 'allMids' }) as Promise<Record<string, string>>,
  ]);

  const data: HlMarketData = {
    meta: metaAndCtxs[0],
    assetCtxs: metaAndCtxs[1],
    mids,
  };

  cachedData = { data, ts: Date.now() };
  return data;
}

export function getAssetIndex(meta: { universe: HlPerpMeta[] }, coin: string): number {
  return meta.universe.findIndex((u) => u.name === coin);
}
