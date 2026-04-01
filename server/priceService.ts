import { resolveToken } from './tokenResolver';
import { getCoinGeckoPrice } from './coingeckoService';
import { getCmcPrice, canUseCmc, recordCmcCredit } from './cmcService';

export interface PriceResult {
  symbol: string;
  name: string;
  priceUsd: number;
  change1h: number | null;
  change24h: number | null;
  change7d: number | null;
  marketCap: number | null;
  volume24h: number | null;
  rank: number | null;
  source: 'jupiter' | 'coingecko' | 'coinmarketcap';
  logoURI: string | null;
  chain: string;
}

const cache = new Map<string, { result: PriceResult; at: number }>();

export async function getPrice(query: string): Promise<PriceResult | null> {
  const key = query.toUpperCase().trim();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < 60000) return cached.result;

  let result: PriceResult | null = null;

  try {
    const tok = await resolveToken(query);
    if (tok) {
      const r = await fetch(`https://api.jup.ag/price/v3?ids=${tok.address}`, {
        headers: { 'x-api-key': process.env.JUPITER_API_KEY || '' },
        signal: AbortSignal.timeout(8000),
      });
      const d = await r.json();
      const tp = d.data?.[tok.address] || d[tok.address];
      const priceVal = tp?.price ?? tp?.usdPrice;
      if (priceVal) {
        result = {
          symbol: tok.symbol,
          name: tok.name,
          priceUsd: Number(priceVal),
          change1h: null,
          change24h: tp.priceChange24h ?? null,
          change7d: null,
          marketCap: null,
          volume24h: null,
          rank: null,
          source: 'jupiter',
          logoURI: tok.logoURI,
          chain: 'solana',
        };
      }
    }
  } catch {}

  if (!result) {
    try {
      const cg = await getCoinGeckoPrice(query);
      if (cg) {
        result = {
          symbol: cg.symbol,
          name: cg.name,
          priceUsd: cg.priceUsd,
          change1h: null,
          change24h: cg.change24h,
          change7d: null,
          marketCap: cg.marketCap,
          volume24h: null,
          rank: null,
          source: 'coingecko',
          logoURI: cg.logoURI,
          chain: cg.chain,
        };
      }
    } catch {}
  }

  if (!result && canUseCmc()) {
    try {
      const cmc = await getCmcPrice(query);
      if (cmc) {
        recordCmcCredit();
        result = {
          symbol: cmc.symbol,
          name: cmc.name,
          priceUsd: cmc.priceUsd,
          change1h: cmc.change1h,
          change24h: cmc.change24h,
          change7d: cmc.change7d,
          marketCap: cmc.marketCap,
          volume24h: cmc.volume24h,
          rank: cmc.cmcRank,
          source: 'coinmarketcap',
          logoURI: null,
          chain: 'multi-chain',
        };
      }
    } catch {}
  }

  if (result) cache.set(key, { result, at: Date.now() });
  return result;
}
