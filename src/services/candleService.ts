export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CandleResult {
  symbol: string;
  candles: CandleData[];
  source: 'hyperliquid' | 'coingecko' | 'aster' | 'generated';
  interval: string;
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
  AAVE: 'aave',
  SHIB: 'shiba-inu',
  PEPE: 'pepe',
  WIF: 'dogwifcoin',
  JUP: 'jupiter-exchange-solana',
  BONK: 'bonk',
  PYTH: 'pyth-network',
  RAY: 'raydium',
  RENDER: 'render-token',
  INJ: 'injective-protocol',
  TIA: 'celestia',
  SEI: 'sei-network',
  TRUMP: 'official-trump',
};

const INTERVAL_SECONDS: Record<string, number> = {
  '1M': 60,
  '5M': 300,
  '15M': 900,
  '1H': 3600,
  '4H': 14400,
  '1D': 86400,
  '1W': 604800,
};

function intervalToHLInterval(interval: string): string {
  switch (interval) {
    case '1M': return '1m';
    case '5M': return '5m';
    case '15M': return '15m';
    case '1H': return '1h';
    case '4H': return '4h';
    case '1D': return '1d';
    case '1W': return '1w';
    default: return '1h';
  }
}

function intervalToLookbackMs(interval: string): number {
  const now = Date.now();
  switch (interval) {
    case '1M':  return now - 1  * 24 * 60 * 60 * 1000;
    case '5M':  return now - 4  * 24 * 60 * 60 * 1000;
    case '15M': return now - 14 * 24 * 60 * 60 * 1000;
    case '1H':  return now - 365 * 24 * 60 * 60 * 1000;
    case '4H':  return now - 365 * 24 * 60 * 60 * 1000;
    case '1D':  return now - 3 * 365 * 24 * 60 * 60 * 1000;
    case '1W':  return now - 5 * 365 * 24 * 60 * 60 * 1000;
    default:    return now - 90 * 24 * 60 * 60 * 1000;
  }
}

function intervalToCoinGeckoDays(interval: string): number {
  switch (interval) {
    case '1M':  return 1;
    case '5M':  return 4;
    case '15M': return 14;
    case '1H':  return 365;
    case '4H':  return 365;
    case '1D':  return 365;
    case '1W':  return 365;
    default:    return 30;
  }
}

function intervalToMinHistoryDays(interval: string): number {
  switch (interval) {
    case '1M':  return 1;
    case '5M':  return 4;
    case '15M': return 14;
    case '1H':  return 365;
    case '4H':  return 365;
    case '1D':  return 365;
    case '1W':  return 365;
    default:    return 365;
  }
}

function intervalToAsterLimit(interval: string): number {
  switch (interval) {
    case '1M':  return 4320; // ~3 days at 1m (avoids over-heavy payloads)
    case '5M':  return 3000; // ~10 days
    case '15M': return 3000; // ~31 days
    case '1H':  return 3000; // ~125 days
    case '4H':  return 2000; // ~333 days
    case '1D':  return 1200; // >3 years
    case '1W':  return 520;  // ~10 years
    default:    return 1500;
  }
}

function hasMinHistory(candles: CandleData[], minDays: number): boolean {
  if (!candles.length) return false;
  const first = candles[0]?.time || 0;
  const last = candles[candles.length - 1]?.time || 0;
  if (!first || !last || last <= first) return false;
  const spanDays = (last - first) / 86400;
  return spanDays >= minDays;
}

function stripPerpSuffix(symbol: string): string {
  return symbol.toUpperCase()
    .replace(/-PERP$/, '')
    .replace(/USDT$/, '')
    .replace(/USD$/, '');
}

export async function fetchHyperliquidCandles(symbol: string, interval: string = '1H'): Promise<CandleResult | null> {
  try {
    const coin = stripPerpSuffix(symbol);
    const hlInterval = intervalToHLInterval(interval);
    const startTime = intervalToLookbackMs(interval);

    const body = {
      type: 'candleSnapshot',
      req: { coin, interval: hlInterval, startTime },
    };

    const res = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const candles: CandleData[] = data.map((k: any) => ({
      time: Math.floor(k.t / 1000),
      open: parseFloat(k.o),
      high: parseFloat(k.h),
      low: parseFloat(k.l),
      close: parseFloat(k.c),
      volume: parseFloat(k.v || '0'),
    })).filter((c: CandleData) => c.time > 0 && c.open > 0);

    if (candles.length < 3) return null;

    return { symbol: coin, candles, source: 'hyperliquid', interval };
  } catch {
    return null;
  }
}

export async function fetchCoinGeckoOHLC(symbol: string, interval: string = '1H'): Promise<CandleResult | null> {
  const upper = stripPerpSuffix(symbol);
  const cgId = SYMBOL_TO_CG_ID[upper];
  if (!cgId) return null;

  try {
    const days = intervalToCoinGeckoDays(interval);
    const cgKey = process.env.COINGECKO_API_KEY || '';
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (cgKey) headers['x-cg-demo-api-key'] = cgKey;

    const url = `https://api.coingecko.com/api/v3/coins/${cgId}/ohlc?vs_currency=usd&days=${days}`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const candles: CandleData[] = data.map((point: number[]) => ({
      time: Math.floor(point[0] / 1000),
      open: point[1],
      high: point[2],
      low: point[3],
      close: point[4],
    }));

    return { symbol: upper, candles, source: 'coingecko', interval };
  } catch {
    return null;
  }
}

export function generateCandles(basePrice: number, count: number, interval: string): CandleData[] {
  const candles: CandleData[] = [];
  let price = basePrice * 0.95;
  const now = Math.floor(Date.now() / 1000);
  const step = INTERVAL_SECONDS[interval] || 3600;

  for (let i = 0; i < count; i++) {
    const open = price;
    const close = open * (1 + (Math.random() - 0.48) * 0.02);
    const high = Math.max(open, close) * (1 + Math.random() * 0.006);
    const low = Math.min(open, close) * (1 - Math.random() * 0.006);

    candles.push({
      time: now - (count - i) * step,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000000 + 100000,
    });
    price = close;
  }
  return candles;
}

function intervalToAster(interval: string): string {
  switch (interval) {
    case '1M': return '1m';
    case '5M': return '5m';
    case '15M': return '15m';
    case '1H': return '1h';
    case '4H': return '4h';
    case '1D': return '1d';
    case '1W': return '1w';
    default: return '1h';
  }
}

export async function fetchAsterCandles(symbol: string, interval: string = '1H'): Promise<CandleResult | null> {
  try {
    const asterInterval = intervalToAster(interval);
    const asterSymbol = symbol.toUpperCase().endsWith('USDT') ? symbol.toUpperCase() : symbol.toUpperCase() + 'USDT';
    const limit = intervalToAsterLimit(interval);
    const res = await fetch(`/api/aster/klines?symbol=${asterSymbol}&interval=${asterInterval}&limit=${limit}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const candles: CandleData[] = data.map((k: any[]) => ({
      time: Math.floor(k[0] / 1000),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5] || '0'),
    })).filter((c: CandleData) => c.time > 0 && c.open > 0);

    if (candles.length === 0) return null;

    return { symbol: symbol.toUpperCase(), candles, source: 'aster' as any, interval };
  } catch {
    return null;
  }
}

export async function fetchCandles(symbol: string, interval: string = '1H', chain?: string): Promise<CandleResult> {
  const upper = symbol.toUpperCase();
  const normalized = upper
    .replace(/-PERP$/i, '')
    .replace(/-USD$/i, '')
    .replace(/^1M/i, '');
  const minDays = intervalToMinHistoryDays(interval);

  // Aster pairs are mostly USDT-quoted; also allow explicit Arbitrum routing.
  const shouldTryAster = upper.endsWith('USDT') || chain === 'Arbitrum';
  if (shouldTryAster) {
    const asterSymbol = normalized.endsWith('USDT') ? normalized : `${normalized}USDT`;
    const asterResult = await fetchAsterCandles(asterSymbol, interval);
    if (asterResult && asterResult.candles.length > 5 && hasMinHistory(asterResult.candles, minDays)) {
      return asterResult;
    }
  }

  const hlResult = await fetchHyperliquidCandles(normalized, interval);
  if (hlResult && hlResult.candles.length > 5 && hasMinHistory(hlResult.candles, minDays)) {
    return hlResult;
  }

  const cgResult = await fetchCoinGeckoOHLC(normalized, interval);
  if (cgResult && cgResult.candles.length > 5 && hasMinHistory(cgResult.candles, minDays)) {
    return cgResult;
  }

  const step = INTERVAL_SECONDS[interval] || 3600;
  const generatedCount = Math.max(240, Math.ceil((minDays * 86400) / step));
  const basePrice = normalized.includes('BTC') ? 95000 : normalized.includes('ETH') ? 3500 : normalized.includes('SOL') ? 180 : 1;
  return {
    symbol: normalized,
    candles: generateCandles(basePrice, generatedCount, interval),
    source: 'generated',
    interval,
  };
}
