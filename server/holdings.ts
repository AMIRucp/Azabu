import axios from 'axios';
import { REGISTRY_BY_MINT } from './tokenRegistry';
import { getTokenPrices } from './jupiter';
import { getCached, setCache, dedupeRequest } from './cache';

const JUPITER_BASE = 'https://api.jup.ag';
const API_KEY = process.env.JUPITER_API_KEY;
const headers: Record<string, string> = {};
if (API_KEY) headers['x-api-key'] = API_KEY;

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const HOLDINGS_CACHE_TTL = 30_000;
const AXIOS_TIMEOUT = 8000;

export interface EnrichedHolding {
  mint: string;
  name: string;
  symbol: string;
  logoURI: string | null;
  balance: number;
  balanceRaw: string;
  decimals: number;
  usdValue: number | null;
  usdPrice: number | null;
  priceChange24h: number | null;
  isVerified: boolean;
  tags: string[];
  category?: 'crypto' | 'stock' | 'etf' | 'commodity';
  company?: string;
}

export interface HoldingsResult {
  solBalance: number;
  solUsdPrice: number;
  solUsdValue: number;
  totalUsdValue: number;
  tokens: EnrichedHolding[];
}

export async function getEnrichedHoldings(walletAddress: string): Promise<HoldingsResult> {
  const cacheKey = `holdings:${walletAddress}`;
  const cached = getCached<HoldingsResult>(cacheKey, HOLDINGS_CACHE_TTL);
  if (cached) return cached;

  return dedupeRequest(cacheKey, async () => {
    const holdingsRes = await axios.get(
      `${JUPITER_BASE}/ultra/v1/holdings/${walletAddress}`,
      { headers, timeout: AXIOS_TIMEOUT }
    );
    const holdings = holdingsRes.data;
    const solBalance = holdings.uiAmount || 0;

    const tokenEntries: { mint: string; amount: string; uiAmount: number; decimals: number }[] = [];
    if (holdings.tokens) {
      for (const [mint, accounts] of Object.entries(holdings.tokens)) {
        const accs = accounts as any[];
        let totalAmount = '0';
        let totalUi = 0;
        let dec = 9;
        for (const acc of accs) {
          totalUi += acc.uiAmount || 0;
          totalAmount = acc.amount || totalAmount;
          if (acc.decimals) dec = acc.decimals;
        }
        if (totalUi > 0) {
          tokenEntries.push({ mint, amount: totalAmount, uiAmount: totalUi, decimals: dec });
        }
      }
    }

    const allMints = [SOL_MINT, ...tokenEntries.map(t => t.mint)];

    const [metadataResult, pricesResult] = await Promise.allSettled([
      fetchTokenMetadata(allMints),
      getTokenPrices(allMints),
    ]);

    const metadataOk = metadataResult.status === 'fulfilled';
    const pricesOk = pricesResult.status === 'fulfilled';
    const tokenMetadata: Record<string, any> =
      metadataOk ? metadataResult.value : {};
    const prices: Record<string, { usdPrice: number; priceChange24h?: number }> =
      pricesOk ? pricesResult.value : {};

    const tokens: EnrichedHolding[] = tokenEntries.map(entry => {
      const meta = tokenMetadata[entry.mint];
      const known = REGISTRY_BY_MINT[entry.mint];
      const priceData = prices[entry.mint];

      return {
        mint: entry.mint,
        name: meta?.name || known?.name || 'Unknown Token',
        symbol: meta?.symbol || known?.symbol || entry.mint.slice(0, 6),
        logoURI: meta?.icon || meta?.logoURI || known?.logoURI || null,
        balance: entry.uiAmount,
        balanceRaw: entry.amount,
        decimals: meta?.decimals || known?.decimals || entry.decimals,
        usdValue: priceData ? entry.uiAmount * priceData.usdPrice : null,
        usdPrice: priceData?.usdPrice || null,
        priceChange24h: priceData?.priceChange24h || null,
        isVerified: meta?.isVerified || (meta?.tags || []).includes('verified') || !!known,
        tags: meta?.tags || [],
        category: known?.category,
        company: known?.company,
      };
    });

    tokens.sort((a, b) => {
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      return (b.usdValue || 0) - (a.usdValue || 0);
    });

    const solPrice = prices[SOL_MINT]?.usdPrice || 0;
    const solUsd = solBalance * solPrice;
    const tokenUsd = tokens.reduce((sum, t) => sum + (t.usdValue || 0), 0);

    const result: HoldingsResult = {
      solBalance,
      solUsdPrice: solPrice,
      solUsdValue: solUsd,
      totalUsdValue: solUsd + tokenUsd,
      tokens,
    };

    if (metadataOk || pricesOk) {
      setCache(cacheKey, result);
    }
    return result;
  });
}

async function fetchTokenMetadata(mints: string[]): Promise<Record<string, any>> {
  const sorted = [...mints].sort();
  const metadataCacheKey = `tokenMeta:${sorted.join(',')}`;
  const cached = getCached<Record<string, any>>(metadataCacheKey, 86_400_000);
  if (cached) return cached;

  const result: Record<string, any> = {};
  for (let i = 0; i < mints.length; i += 100) {
    const batch = mints.slice(i, i + 100).join(',');
    const metaRes = await axios.get(
      `${JUPITER_BASE}/ultra/v1/search?query=${batch}`,
      { headers, timeout: AXIOS_TIMEOUT }
    );
    const results = metaRes.data || [];
    for (const token of results) {
      const addr = token.address || token.id;
      if (addr) result[addr] = token;
    }
  }

  if (Object.keys(result).length > 0) {
    setCache(metadataCacheKey, result);
  }
  return result;
}
