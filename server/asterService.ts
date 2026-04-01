import crypto from 'crypto';

const BASE_URL = process.env.ASTER_BASE_URL || 'https://fapi.asterdex.com';

export interface AsterCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface SymbolRules {
  symbol: string;
  pricePrecision: number;
  quantityPrecision: number;
  tickSize: string;
  stepSize: string;
  minQty: string;
  maxQty: string;
  minNotional: string;
}

let rulesCache: Map<string, SymbolRules> = new Map();
let rulesFetchedAt = 0;
const RULES_TTL = 10 * 60 * 1000;

export async function getSymbolRules(symbol: string): Promise<SymbolRules | null> {
  if (Date.now() - rulesFetchedAt > RULES_TTL || rulesCache.size === 0) {
    await refreshRulesCache();
  }
  return rulesCache.get(symbol) || null;
}

async function refreshRulesCache(): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/fapi/v1/exchangeInfo`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data.symbols)) return;
    const newCache = new Map<string, SymbolRules>();
    for (const s of data.symbols) {
      if (s.status !== 'TRADING') continue;
      const lotFilter = s.filters?.find((f: any) => f.filterType === 'LOT_SIZE');
      const priceFilter = s.filters?.find((f: any) => f.filterType === 'PRICE_FILTER');
      const notionalFilter = s.filters?.find((f: any) => f.filterType === 'MIN_NOTIONAL');
      newCache.set(s.symbol, {
        symbol: s.symbol,
        pricePrecision: s.pricePrecision || 2,
        quantityPrecision: s.quantityPrecision || 3,
        tickSize: priceFilter?.tickSize || '0.01',
        stepSize: lotFilter?.stepSize || '0.001',
        minQty: lotFilter?.minQty || '0.001',
        maxQty: lotFilter?.maxQty || '100000',
        minNotional: notionalFilter?.notional || '5',
      });
    }
    rulesCache = newCache;
    rulesFetchedAt = Date.now();
    console.log(`[Aster] Cached trading rules for ${newCache.size} symbols`);
  } catch (err: any) {
    console.error('[Aster] Failed to refresh rules cache:', err.message);
  }
}

export function quantize(value: number, stepStr: string, precision: number): string {
  const step = parseFloat(stepStr);
  if (step <= 0 || isNaN(step)) return value.toFixed(precision);
  const quantized = Math.floor(value / step) * step;
  return quantized.toFixed(precision);
}

export function signRequest(params: Record<string, string>, secret: string): string {
  const queryString = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

export async function asterRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  params: Record<string, string>,
  creds: AsterCredentials
): Promise<any> {
  const timestamp = Date.now().toString();
  const allParams = { ...params, timestamp, recvWindow: '5000' };
  const signature = signRequest(allParams, creds.apiSecret);
  const qs = Object.entries({ ...allParams, signature })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  const url = `${BASE_URL}${endpoint}?${qs}`;
  const res = await fetch(url, {
    method,
    headers: { 'X-MBX-APIKEY': creds.apiKey },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.msg || err.message || JSON.stringify(err) || 'Unknown error';
    console.error(`[Aster] ${method} ${endpoint} failed ${res.status}:`, detail, 'params:', JSON.stringify(params));
    throw new Error(`Aster API ${res.status}: ${detail}`);
  }
  return res.json();
}

export async function getExchangeInfo(): Promise<any> {
  const res = await fetch(`${BASE_URL}/fapi/v1/exchangeInfo`);
  return res.json();
}

export async function getMarkPrice(symbol?: string): Promise<any> {
  const url = symbol
    ? `${BASE_URL}/fapi/v1/premiumIndex?symbol=${symbol}`
    : `${BASE_URL}/fapi/v1/premiumIndex`;
  const res = await fetch(url);
  return res.json();
}

export async function openPosition(
  creds: AsterCredentials,
  symbol: string,
  side: 'BUY' | 'SELL',
  quantity: string,
  leverage: number,
  orderType: 'MARKET' | 'LIMIT' = 'MARKET',
  price?: string,
  hidden?: boolean
): Promise<any> {
  const rules = await getSymbolRules(symbol);

  let quantizedQty = quantity;
  let quantizedPrice = price;
  if (rules) {
    quantizedQty = quantize(parseFloat(quantity), rules.stepSize, rules.quantityPrecision);
    const minQty = parseFloat(rules.minQty);
    if (parseFloat(quantizedQty) <= 0 || parseFloat(quantizedQty) < minQty) {
      quantizedQty = minQty.toFixed(rules.quantityPrecision);
    }
    if (price) {
      quantizedPrice = quantize(parseFloat(price), rules.tickSize, rules.pricePrecision);
    }
  }

  await asterRequest('POST', '/fapi/v1/leverage', {
    symbol,
    leverage: leverage.toString(),
  }, creds);

  const params: Record<string, string> = {
    symbol,
    side,
    type: orderType,
    quantity: quantizedQty,
  };

  if (orderType === 'LIMIT' && quantizedPrice) {
    params.price = quantizedPrice;
    params.timeInForce = 'GTC';
  }

  if (hidden) {
    params.hidden = 'true';
  }

  return asterRequest('POST', '/fapi/v1/order', params, creds);
}

export async function closePosition(
  creds: AsterCredentials,
  symbol: string,
  side: 'BUY' | 'SELL',
  quantity: string
): Promise<any> {
  const rules = await getSymbolRules(symbol);
  let quantizedQty = quantity;
  if (rules) {
    quantizedQty = quantize(parseFloat(quantity), rules.stepSize, rules.quantityPrecision);
    if (parseFloat(quantizedQty) <= 0) {
      throw new Error(`Close quantity too small for ${symbol} (stepSize: ${rules.stepSize})`);
    }
  }

  return asterRequest('POST', '/fapi/v1/order', {
    symbol,
    side,
    type: 'MARKET',
    quantity: quantizedQty,
    reduceOnly: 'true',
  }, creds);
}

export async function setTakeProfit(
  creds: AsterCredentials,
  symbol: string,
  side: 'BUY' | 'SELL',
  stopPrice: string,
  quantity: string
): Promise<any> {
  const rules = await getSymbolRules(symbol);
  let quantizedPrice = stopPrice;
  let quantizedQty = quantity;
  if (rules) {
    quantizedPrice = quantize(parseFloat(stopPrice), rules.tickSize, rules.pricePrecision);
    quantizedQty = quantize(parseFloat(quantity), rules.stepSize, rules.quantityPrecision);
  }

  if (parseFloat(quantizedQty) <= 0) {
    throw new Error(`TP quantity too small for ${symbol}`);
  }

  return asterRequest('POST', '/fapi/v1/order', {
    symbol,
    side,
    type: 'TAKE_PROFIT_MARKET',
    stopPrice: quantizedPrice,
    quantity: quantizedQty,
    reduceOnly: 'true',
  }, creds);
}

export async function setStopLoss(
  creds: AsterCredentials,
  symbol: string,
  side: 'BUY' | 'SELL',
  stopPrice: string,
  quantity: string
): Promise<any> {
  const rules = await getSymbolRules(symbol);
  let quantizedPrice = stopPrice;
  let quantizedQty = quantity;
  if (rules) {
    quantizedPrice = quantize(parseFloat(stopPrice), rules.tickSize, rules.pricePrecision);
    quantizedQty = quantize(parseFloat(quantity), rules.stepSize, rules.quantityPrecision);
  }

  if (parseFloat(quantizedQty) <= 0) {
    throw new Error(`SL quantity too small for ${symbol}`);
  }

  return asterRequest('POST', '/fapi/v1/order', {
    symbol,
    side,
    type: 'STOP_MARKET',
    stopPrice: quantizedPrice,
    quantity: quantizedQty,
    reduceOnly: 'true',
  }, creds);
}

export async function getPositions(creds: AsterCredentials): Promise<any> {
  return asterRequest('GET', '/fapi/v2/positionRisk', {}, creds);
}

export async function getOpenOrders(creds: AsterCredentials, symbol?: string): Promise<any> {
  const params: Record<string, string> = {};
  if (symbol) params.symbol = symbol;
  return asterRequest('GET', '/fapi/v1/openOrders', params, creds);
}

export async function getBalance(creds: AsterCredentials): Promise<any> {
  return asterRequest('GET', '/fapi/v2/balance', {}, creds);
}

export async function cancelOrder(
  creds: AsterCredentials,
  symbol: string,
  orderId: string
): Promise<any> {
  return asterRequest('DELETE', '/fapi/v1/order', { symbol, orderId }, creds);
}

export async function cancelAllOrders(
  creds: AsterCredentials,
  symbol: string
): Promise<any> {
  return asterRequest('DELETE', '/fapi/v1/allOpenOrders', { symbol }, creds);
}

export async function getOrderBook(symbol: string, limit: number = 20): Promise<any> {
  const res = await fetch(`${BASE_URL}/fapi/v1/depth?symbol=${symbol}&limit=${limit}`);
  return res.json();
}

export async function getKlines(
  symbol: string,
  interval: string = '1h',
  limit: number = 500
): Promise<any> {
  const res = await fetch(
    `${BASE_URL}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );
  return res.json();
}
