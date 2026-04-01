import { TOKEN_REGISTRY } from './tokenRegistry';

const CG_BASE = 'https://api.coingecko.com/api/v3';
const CG_KEY = process.env.COINGECKO_API_KEY || '';

const cgHeaders: Record<string, string> = {
  Accept: 'application/json',
};
if (CG_KEY) {
  cgHeaders['x-cg-demo-api-key'] = CG_KEY;
}

export interface MarketOverviewToken {
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number | null;
  marketCap: number | null;
  logoURI: string | null;
}

export interface MarketOverview {
  tokens: MarketOverviewToken[];
  fearGreedIndex: number | null;
  fearGreedLabel: string | null;
  totalMarketCap: number | null;
  totalVolume24h: number | null;
  btcDominance: number | null;
  activeCryptocurrencies: number | null;
  solanaDexVolume24h?: number | null;
  solanaTvl?: number | null;
  solanaTvlChange24h?: number | null;
}

export interface TrendingToken {
  rank: number;
  name: string;
  symbol: string;
  marketCapRank: number | null;
  priceUsd: number | null;
  change24h: number | null;
  logoURI: string | null;
}

export interface TopMover {
  symbol: string;
  name: string;
  address: string;
  priceUsd: number;
  change24h: number;
  logoURI: string | null;
  volume24h: number | null;
}

export interface TopMoversResult {
  gainers: TopMover[];
  losers: TopMover[];
}

const CACHE_TTL = 60_000;

const cache = new Map<string, { data: any; at: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.at < CACHE_TTL) return entry.data as T;
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, at: Date.now() });
}

const OVERVIEW_COINS = ['bitcoin', 'solana', 'ethereum'];

export async function getMarketOverview(): Promise<MarketOverview> {
  const cached = getCached<MarketOverview>('overview');
  if (cached) return cached;

  const [tokensData, fearGreed, globalData] = await Promise.all([
    fetchOverviewTokens(),
    fetchFearGreed(),
    fetchGlobalData(),
  ]);

  const result: MarketOverview = {
    tokens: tokensData,
    fearGreedIndex: fearGreed?.value ?? null,
    fearGreedLabel: fearGreed?.label ?? null,
    totalMarketCap: globalData?.totalMarketCap ?? null,
    totalVolume24h: globalData?.totalVolume24h ?? null,
    btcDominance: globalData?.btcDominance ?? null,
    activeCryptocurrencies: globalData?.activeCryptocurrencies ?? null,
  };

  setCache('overview', result);
  return result;
}

export async function getMarketAnalysis(): Promise<MarketOverview & { trending?: TrendingToken[] }> {
  const cached = getCached<MarketOverview & { trending?: TrendingToken[] }>('analysis');
  if (cached) return cached;

  const [overview, solanaData, trending] = await Promise.all([
    getMarketOverview(),
    fetchSolanaEcosystem(),
    getTrending(),
  ]);

  const result = {
    ...overview,
    solanaDexVolume24h: solanaData?.dexVolume24h ?? null,
    solanaTvl: solanaData?.tvl ?? null,
    solanaTvlChange24h: solanaData?.tvlChange24h ?? null,
    trending: trending.length > 0 ? trending : undefined,
  };

  setCache('analysis', result);
  return result;
}

async function fetchSolanaEcosystem(): Promise<{
  dexVolume24h: number | null;
  tvl: number | null;
  tvlChange24h: number | null;
} | null> {
  try {
    const [dexRes, tvlRes] = await Promise.all([
      fetch('https://api.llama.fi/overview/dexs/solana', {
        signal: AbortSignal.timeout(8000),
      }).catch(() => null),
      fetch('https://api.llama.fi/v2/chains', {
        signal: AbortSignal.timeout(8000),
      }).catch(() => null),
    ]);

    let dexVolume24h: number | null = null;
    if (dexRes && dexRes.ok) {
      const dexData = await dexRes.json();
      const chart = dexData.totalDataChart;
      if (Array.isArray(chart) && chart.length > 0) {
        dexVolume24h = chart[chart.length - 1]?.[1] || null;
      } else if (dexData.total24h) {
        dexVolume24h = dexData.total24h;
      }
    }

    let tvl: number | null = null;
    let tvlChange24h: number | null = null;
    if (tvlRes && tvlRes.ok) {
      const chains: any[] = await tvlRes.json();
      const solana = chains.find((c: any) => c.name === 'Solana');
      if (solana) {
        tvl = solana.tvl || null;
        tvlChange24h = solana.change_1d ?? null;
      }
    }

    return { dexVolume24h, tvl, tvlChange24h };
  } catch (e) {
    console.error('Solana ecosystem data fetch failed:', e);
    return null;
  }
}

async function fetchOverviewTokens(): Promise<MarketOverviewToken[]> {
  try {
    const ids = OVERVIEW_COINS.join(',');
    const url = `${CG_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`;
    const res = await fetch(url, { headers: cgHeaders, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((coin: any) => ({
      symbol: (coin.symbol || '').toUpperCase(),
      name: coin.name || '',
      priceUsd: coin.current_price || 0,
      change24h: coin.price_change_percentage_24h ?? null,
      marketCap: coin.market_cap ?? null,
      logoURI: coin.image || null,
    }));
  } catch (e) {
    console.error('Market overview tokens fetch failed:', e);
    return [];
  }
}

async function fetchFearGreed(): Promise<{ value: number; label: string } | null> {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data?.data?.[0];
    if (!entry) return null;
    return {
      value: parseInt(entry.value, 10),
      label: entry.value_classification || '',
    };
  } catch (e) {
    console.error('Fear & Greed fetch failed:', e);
    return null;
  }
}

async function fetchGlobalData(): Promise<{
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  activeCryptocurrencies: number;
} | null> {
  try {
    const url = `${CG_BASE}/global`;
    const res = await fetch(url, { headers: cgHeaders, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const gd = data?.data;
    if (!gd) return null;
    return {
      totalMarketCap: gd.total_market_cap?.usd ?? 0,
      totalVolume24h: gd.total_volume?.usd ?? 0,
      btcDominance: gd.market_cap_percentage?.btc ?? 0,
      activeCryptocurrencies: gd.active_cryptocurrencies ?? 0,
    };
  } catch (e) {
    console.error('Global market data fetch failed:', e);
    return null;
  }
}

export async function getTrending(): Promise<TrendingToken[]> {
  const cached = getCached<TrendingToken[]>('trending');
  if (cached) return cached;

  try {
    const url = `${CG_BASE}/search/trending`;
    const res = await fetch(url, { headers: cgHeaders, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    const coins = data?.coins?.slice(0, 5) || [];
    const result: TrendingToken[] = coins.map((entry: any, idx: number) => {
      const item = entry.item || entry;
      return {
        rank: idx + 1,
        name: item.name || '',
        symbol: (item.symbol || '').toUpperCase(),
        marketCapRank: item.market_cap_rank ?? null,
        priceUsd: item.data?.price ?? item.price_btc ?? null,
        change24h: item.data?.price_change_percentage_24h?.usd ?? null,
        logoURI: item.small || item.thumb || item.large || null,
      };
    });
    setCache('trending', result);
    return result;
  } catch (e) {
    console.error('Trending fetch failed:', e);
    return [];
  }
}

export async function getTopMovers(): Promise<TopMoversResult> {
  const cached = getCached<TopMoversResult>('movers');
  if (cached) return cached;

  try {
    const cryptoTokens = Object.values(TOKEN_REGISTRY)
      .filter(t => !t.category && t.address);
    const knownAddresses = cryptoTokens.map(t => t.address);

    if (knownAddresses.length === 0) return { gainers: [], losers: [] };

    const priceMap = await fetchJupiterPrices(knownAddresses);

    const enriched: TopMover[] = [];
    for (const t of cryptoTokens) {
      const pd = priceMap[t.address];
      if (!pd || !pd.price) continue;
      const change = pd.priceChange24h;
      if (change === undefined || change === null) continue;
      enriched.push({
        symbol: t.symbol.toUpperCase(),
        name: t.name,
        address: t.address,
        priceUsd: Number(pd.price),
        change24h: Number(change),
        logoURI: t.logoURI || null,
        volume24h: null,
      });
    }

    enriched.sort((a, b) => b.change24h - a.change24h);
    const gainers = enriched.filter(t => t.change24h > 0).slice(0, 5);
    const losers = enriched.filter(t => t.change24h < 0).sort((a, b) => a.change24h - b.change24h).slice(0, 5);

    const result = { gainers, losers };
    setCache('movers', result);
    return result;
  } catch (e) {
    console.error('Top movers fetch failed:', e);
    return { gainers: [], losers: [] };
  }
}

async function fetchJupiterPrices(addresses: string[]): Promise<Record<string, { price: number; priceChange24h: number | null }>> {
  if (addresses.length === 0) return {};
  try {
    const ids = addresses.join(',');
    const url = `https://api.jup.ag/price/v3?ids=${ids}`;
    const res = await fetch(url, {
      headers: {
        'x-api-key': process.env.JUPITER_API_KEY || '',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return {};
    const data = await res.json();
    const result: Record<string, { price: number; priceChange24h: number | null }> = {};
    const priceData = data.data || data;
    for (const addr of addresses) {
      const entry = priceData[addr];
      if (entry && (entry.usdPrice || entry.price)) {
        result[addr] = {
          price: Number(entry.usdPrice || entry.price),
          priceChange24h: entry.priceChange24h ?? null,
        };
      }
    }
    return result;
  } catch (e) {
    console.error('Jupiter price batch fetch failed:', e);
    return {};
  }
}
