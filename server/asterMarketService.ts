const LEVERAGE_OVERRIDES: Record<string, number> = {
  EDGEUSD1: 5,
  HUSD1: 50,
};

export interface AsterMarket {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  maxLeverage: number;
  pricePrecision: number;
  quantityPrecision: number;
  minQty: string;
  maxQty: string;
  stepSize: string;
  tickSize: string;
  minNotional: string;
  category: 'crypto' | 'stock' | 'commodity' | 'other';
}

const BASE_URL = process.env.ASTER_BASE_URL || 'https://fapi.asterdex.com';
const MARKET_CACHE_TTL = 5 * 60 * 1000;

let marketCache: AsterMarket[] = [];
let lastFetch = 0;

const STOCK_SYMBOLS = new Set([
  'AAPLUSDT', 'TSLAUSDT', 'NVDAUSDT', 'AMZNUSDT', 'METAUSDT',
  'GOOGUSDT', 'MSFTUSDT', 'QQQUSDT', 'HOODUSDT', 'INTCUSDT',
  'MUUSDT', 'SNDKUSDT', 'CRCLUSDT', 'EWYUSDT',
]);

const COMMODITY_SYMBOLS = new Set([
  'XAUUSDT', 'XAGUSDT', 'XCUUSDT', 'XPTUSDT', 'XPDUSDT',
  'CLUSDT', 'NATGASUSDT', 'PAXGUSDT',
]);

function classifyMarket(symbol: string): AsterMarket['category'] {
  if (STOCK_SYMBOLS.has(symbol)) return 'stock';
  if (COMMODITY_SYMBOLS.has(symbol)) return 'commodity';
  return 'crypto';
}

export async function getAsterMarkets(): Promise<AsterMarket[]> {
  if (Date.now() - lastFetch < MARKET_CACHE_TTL && marketCache.length) {
    return marketCache;
  }

  try {
    const res = await fetch(`${BASE_URL}/fapi/v1/exchangeInfo`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error(`Aster exchangeInfo failed: ${res.status}`);
      return marketCache.length ? marketCache : [];
    }
    const data = await res.json();

    if (!data.symbols || !Array.isArray(data.symbols)) {
      return marketCache.length ? marketCache : [];
    }

    marketCache = data.symbols
      .filter((s: any) => s.status === 'TRADING' && s.contractType === 'PERPETUAL')
      .map((s: any) => {
        const lotFilter = s.filters?.find((f: any) => f.filterType === 'LOT_SIZE');
        const priceFilter = s.filters?.find((f: any) => f.filterType === 'PRICE_FILTER');
        const notionalFilter = s.filters?.find((f: any) => f.filterType === 'MIN_NOTIONAL');
        return {
          symbol: s.symbol,
          baseAsset: s.baseAsset,
          quoteAsset: s.quoteAsset || 'USDT',
          status: s.status,
          maxLeverage: LEVERAGE_OVERRIDES[s.symbol] ?? s.leverageBrackets?.[0]?.maxLeverage ?? 75,
          pricePrecision: s.pricePrecision || 2,
          quantityPrecision: s.quantityPrecision || 3,
          minQty: lotFilter?.minQty || '0.001',
          maxQty: lotFilter?.maxQty || '1000',
          stepSize: lotFilter?.stepSize || '0.001',
          tickSize: priceFilter?.tickSize || '0.01',
          minNotional: notionalFilter?.notional || '5',
          category: classifyMarket(s.symbol),
        };
      });

    lastFetch = Date.now();
    console.log(`Aster: loaded ${marketCache.length} markets`);
    return marketCache;
  } catch (err: any) {
    console.error('Aster market fetch error:', err.message);
    return marketCache.length ? marketCache : [];
  }
}

export async function findAsterMarket(query: string): Promise<AsterMarket | null> {
  const markets = await getAsterMarkets();
  const q = query.toUpperCase();
  return markets.find(m => m.symbol === q || m.symbol === q + 'USDT')
    || markets.find(m => m.baseAsset === q)
    || null;
}

export function getCachedMarkets(): AsterMarket[] {
  return marketCache;
}
