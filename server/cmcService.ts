const CMC_BASE = 'https://pro-api.coinmarketcap.com/v1';
const CMC_KEY = process.env.CMC_API_KEY || '';

const cmcHeaders: Record<string, string> = {
  'X-CMC_PRO_API_KEY': CMC_KEY,
  Accept: 'application/json',
};

let cmcMapCache: Map<string, { id: number; name: string; symbol: string; slug: string }> = new Map();
let cmcMapLastFetch = 0;

export async function ensureCmcMap() {
  if (!CMC_KEY) return;
  const now = Date.now();
  if (cmcMapCache.size > 0 && now - cmcMapLastFetch < 86400000) return;
  try {
    const res = await fetch(
      `${CMC_BASE}/cryptocurrency/map?limit=5000&sort=cmc_rank`,
      { headers: cmcHeaders, signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    if (data.status?.error_code === 0 && data.data) {
      cmcMapCache = new Map();
      for (const coin of data.data) {
        cmcMapCache.set(coin.symbol.toUpperCase(), coin);
        cmcMapCache.set(coin.slug.toLowerCase(), coin);
      }
      cmcMapLastFetch = now;
      recordCmcCredit();
    }
  } catch (err) {
    console.error('CMC map fetch failed:', err);
  }
}

export interface CmcPriceResult {
  symbol: string;
  name: string;
  priceUsd: number;
  change1h: number | null;
  change24h: number | null;
  change7d: number | null;
  marketCap: number | null;
  volume24h: number | null;
  cmcRank: number | null;
}

export async function getCmcPrice(query: string): Promise<CmcPriceResult | null> {
  if (!CMC_KEY) return null;
  await ensureCmcMap();

  const entry = cmcMapCache.get(query.toUpperCase()) || cmcMapCache.get(query.toLowerCase());
  if (!entry) return null;

  try {
    const res = await fetch(
      `${CMC_BASE}/cryptocurrency/quotes/latest?id=${entry.id}&convert=USD`,
      { headers: cmcHeaders, signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();
    const coin = data.data?.[String(entry.id)];
    if (!coin) return null;
    const q = coin.quote?.USD;
    if (!q) return null;

    return {
      symbol: coin.symbol,
      name: coin.name,
      priceUsd: q.price,
      change1h: q.percent_change_1h ?? null,
      change24h: q.percent_change_24h ?? null,
      change7d: q.percent_change_7d ?? null,
      marketCap: q.market_cap ?? null,
      volume24h: q.volume_24h ?? null,
      cmcRank: coin.cmc_rank ?? null,
    };
  } catch (err) {
    console.error('CMC price fetch failed:', err);
    return null;
  }
}

let cmcCreditsToday = 0;
let cmcResetDate = new Date().toISOString().split('T')[0];
const CMC_DAILY_BUDGET = 250;

export function canUseCmc(): boolean {
  if (!CMC_KEY) return false;
  const today = new Date().toISOString().split('T')[0];
  if (today !== cmcResetDate) {
    cmcCreditsToday = 0;
    cmcResetDate = today;
  }
  return cmcCreditsToday < CMC_DAILY_BUDGET;
}

export function recordCmcCredit() {
  cmcCreditsToday++;
}
