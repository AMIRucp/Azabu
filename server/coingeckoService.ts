const CG_BASE = 'https://api.coingecko.com/api/v3';
const CG_KEY = process.env.COINGECKO_API_KEY || '';

const cgHeaders: Record<string, string> = {
  Accept: 'application/json',
};
if (CG_KEY) {
  cgHeaders['x-cg-demo-api-key'] = CG_KEY;
}

const SYMBOL_TO_CG_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  USDC: 'usd-coin',
  USDT: 'tether',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  ATOM: 'cosmos',
  UNI: 'uniswap',
  LTC: 'litecoin',
  NEAR: 'near',
  APT: 'aptos',
  SUI: 'sui',
  ARB: 'arbitrum',
  OP: 'optimism',
  FIL: 'filecoin',
  AAVE: 'aave',
  MKR: 'maker',
  SHIB: 'shiba-inu',
  PEPE: 'pepe',
  WIF: 'dogwifcoin',
  JUP: 'jupiter-exchange-solana',
  BONK: 'bonk',
  PYTH: 'pyth-network',
  RAY: 'raydium',
  ORCA: 'orca',
  RENDER: 'render-token',
  INJ: 'injective-protocol',
  TIA: 'celestia',
  SEI: 'sei-network',
  MANA: 'decentraland',
  SAND: 'the-sandbox',
  AXS: 'axie-infinity',
  FTM: 'fantom',
  ALGO: 'algorand',
  HBAR: 'hedera-hashgraph',
  VET: 'vechain',
  ICP: 'internet-computer',
  TRX: 'tron',
  TON: 'the-open-network',
  RUNE: 'thorchain',
  CRO: 'crypto-com-chain',
  STX: 'blockstack',
  FLOKI: 'floki',
  WLD: 'worldcoin-wld',
  JTO: 'jito-governance-token',
  W: 'wormhole',
  RNDR: 'render-token',
  TRUMP: 'official-trump',
  MELANIA: 'melania-meme',
};

const NAME_TO_CG_ID: Record<string, string> = {
  bitcoin: 'bitcoin',
  ethereum: 'ethereum',
  solana: 'solana',
  cardano: 'cardano',
  dogecoin: 'dogecoin',
  polkadot: 'polkadot',
  avalanche: 'avalanche-2',
  chainlink: 'chainlink',
  uniswap: 'uniswap',
  litecoin: 'litecoin',
  cosmos: 'cosmos',
  arbitrum: 'arbitrum',
  optimism: 'optimism',
  celestia: 'celestia',
  aptos: 'aptos',
  sui: 'sui',
  near: 'near',
  tron: 'tron',
  ripple: 'ripple',
  render: 'render-token',
};

export interface CoinGeckoPriceResult {
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number | null;
  marketCap: number | null;
  logoURI: string | null;
  chain: string;
}

const searchCache = new Map<string, string | null>();

function resolveCoingeckoId(query: string): string | null {
  const upper = query.toUpperCase().trim();
  const lower = query.toLowerCase().trim();

  if (SYMBOL_TO_CG_ID[upper]) return SYMBOL_TO_CG_ID[upper];
  if (NAME_TO_CG_ID[lower]) return NAME_TO_CG_ID[lower];

  return null;
}

async function searchCoingeckoId(query: string): Promise<string | null> {
  const key = query.toLowerCase().trim();
  if (searchCache.has(key)) return searchCache.get(key) || null;

  try {
    const url = `${CG_BASE}/search?query=${encodeURIComponent(key)}`;
    const res = await fetch(url, { headers: cgHeaders, signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      searchCache.set(key, null);
      return null;
    }
    const data = await res.json();
    const coins = data?.coins;
    if (!Array.isArray(coins) || coins.length === 0) {
      searchCache.set(key, null);
      return null;
    }
    const upper = query.toUpperCase().trim();
    const exact = coins.find((c: any) => c.symbol?.toUpperCase() === upper)
      || coins.find((c: any) => c.name?.toLowerCase() === key)
      || coins[0];
    const id = exact?.id || null;
    searchCache.set(key, id);
    if (id && upper.length <= 10) {
      SYMBOL_TO_CG_ID[upper] = id;
    }
    return id;
  } catch {
    searchCache.set(key, null);
    return null;
  }
}

async function resolveOrSearchId(query: string): Promise<string | null> {
  return resolveCoingeckoId(query) || await searchCoingeckoId(query);
}

const CG_PRICE_TTL = 30_000;
const cgPriceCache = new Map<string, { data: CoinGeckoPriceResult | null; ts: number }>();

export async function getCoinGeckoPrice(query: string): Promise<CoinGeckoPriceResult | null> {
  const cacheKey = query.toLowerCase().trim();
  const cached = cgPriceCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CG_PRICE_TTL) return cached.data;

  const cgId = await resolveOrSearchId(query);
  if (!cgId) { cgPriceCache.set(cacheKey, { data: null, ts: Date.now() }); return null; }

  try {
    const url = `${CG_BASE}/coins/${cgId}?localization=false&tickers=false&community_data=false&developer_data=false`;
    const res = await fetch(url, { headers: cgHeaders, signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      if (res.status === 429) console.warn('CoinGecko rate limited (price)');
      return null;
    }
    const data = await res.json();
    const md = data?.market_data;
    if (!md) return null;

    const result: CoinGeckoPriceResult = {
      symbol: (data.symbol || query).toUpperCase(),
      name: data.name || cgId,
      priceUsd: md.current_price?.usd ?? 0,
      change24h: md.price_change_percentage_24h ?? null,
      marketCap: md.market_cap?.usd ?? null,
      logoURI: data.image?.small ?? null,
      chain: 'coingecko',
    };
    cgPriceCache.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  } catch (err) {
    console.error('CoinGecko price fetch failed:', err);
    cgPriceCache.set(cacheKey, { data: null, ts: Date.now() });
    return null;
  }
}

const CG_CHART_TTL = 60_000;
const cgChartCache = new Map<string, { data: MarketChartResult | null; ts: number }>();

export interface MarketChartPoint {
  timestamp: number;
  price: number;
}

export interface MarketChartResult {
  symbol: string;
  name: string;
  prices: MarketChartPoint[];
  currentPrice: number;
  changePeriod: number | null;
  high: number;
  low: number;
  days: number;
}

export async function getMarketChart(query: string, days: number = 7): Promise<MarketChartResult | null> {
  const chartKey = `${query.toLowerCase().trim()}:${days}`;
  const chartCached = cgChartCache.get(chartKey);
  if (chartCached && Date.now() - chartCached.ts < CG_CHART_TTL) return chartCached.data;

  const cgId = await resolveOrSearchId(query);
  if (!cgId) { cgChartCache.set(chartKey, { data: null, ts: Date.now() }); return null; }

  try {
    const url = `${CG_BASE}/coins/${cgId}/market_chart?vs_currency=usd&days=${days}`;
    const res = await fetch(url, { headers: cgHeaders, signal: AbortSignal.timeout(12000) });

    if (!res.ok) {
      if (res.status === 429) console.warn('CoinGecko rate limited (chart)');
      return null;
    }

    const data = await res.json();
    if (!data?.prices || !Array.isArray(data.prices) || data.prices.length === 0) return null;

    const prices: MarketChartPoint[] = data.prices.map((p: [number, number]) => ({
      timestamp: p[0],
      price: p[1],
    }));

    const priceVals = prices.map(p => p.price);
    const currentPrice = priceVals[priceVals.length - 1];
    const firstPrice = priceVals[0];
    const changePeriod = firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : null;

    const result: MarketChartResult = {
      symbol: query.toUpperCase(),
      name: cgId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      prices,
      currentPrice,
      changePeriod,
      high: Math.max(...priceVals),
      low: Math.min(...priceVals),
      days,
    };
    cgChartCache.set(chartKey, { data: result, ts: Date.now() });
    return result;
  } catch (err) {
    console.error('CoinGecko chart fetch failed:', err);
    cgChartCache.set(chartKey, { data: null, ts: Date.now() });
    return null;
  }
}
