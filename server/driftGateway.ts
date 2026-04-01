const GATEWAY = process.env.DRIFT_GATEWAY_HOST || 'http://localhost:8080';
const TIMEOUT = 8000;

async function gw(path: string, opts?: RequestInit): Promise<any> {
  const res = await fetch(`${GATEWAY}${path}`, {
    ...opts,
    signal: AbortSignal.timeout(TIMEOUT),
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Gateway ${res.status}: ${text}`);
  }
  return res.json();
}

export interface GatewayMarket {
  marketIndex: number;
  symbol: string;
  marketType: 'perp' | 'spot';
  baseAssetSymbol?: string;
}

let marketCache: { data: GatewayMarket[]; ts: number } | null = null;
const MARKET_CACHE_TTL = 300_000;

export async function getMarkets(): Promise<GatewayMarket[]> {
  if (marketCache && Date.now() - marketCache.ts < MARKET_CACHE_TTL) {
    return marketCache.data;
  }
  try {
    const data = await gw('/v2/markets');
    const markets = Array.isArray(data) ? data : data?.markets || [];
    marketCache = { data: markets, ts: Date.now() };
    return markets;
  } catch (e: any) {
    console.error('Gateway getMarkets failed:', e.message);
    return [];
  }
}

export function resolveMarketIndex(symbol: string): number {
  const map: Record<string, number> = { SOL: 0, BTC: 1, ETH: 2 };
  return map[symbol.toUpperCase()] ?? 0;
}

export async function setLeverage(leverage: number): Promise<any> {
  return gw('/v2/leverage', {
    method: 'POST',
    body: JSON.stringify({ leverage: String(leverage) }),
  });
}

export async function getCollateral(): Promise<{ total: string; free: string }> {
  return gw('/v2/collateral');
}

export async function placePerp(
  marketIndex: number,
  amount: number,
  direction: 'long' | 'short',
  orderType: string = 'market',
  reduceOnly: boolean = false,
  price?: number
): Promise<any> {
  const signedAmount = direction === 'short' ? -Math.abs(amount) : Math.abs(amount);
  const order: any = {
    marketIndex,
    marketType: 'perp',
    amount: signedAmount,
    orderType,
    reduceOnly,
  };
  if (price && orderType !== 'market') {
    order.price = price;
  }
  return gw('/v2/orders?computeUnitPrice=5000&ttl=4', {
    method: 'POST',
    body: JSON.stringify({ orders: [order] }),
  });
}

export async function closePerp(marketIndex: number, currentAmount: number): Promise<any> {
  const closeAmount = -currentAmount;
  return gw('/v2/orders', {
    method: 'POST',
    body: JSON.stringify({
      orders: [{
        marketIndex,
        marketType: 'perp',
        amount: closeAmount,
        orderType: 'market',
        reduceOnly: true,
      }],
    }),
  });
}

export async function getPositions(): Promise<{ spot: any[]; perp: any[] }> {
  return gw('/v2/positions');
}

export async function getPositionInfo(marketIndex: number): Promise<{
  amount: string;
  averageEntry: string;
  liquidationPrice: string;
  unrealizedPnl: string;
  unsettledPnl: string;
  oraclePrice: string;
}> {
  return gw(`/v2/positionInfo/${marketIndex}`);
}

export async function getOrders(): Promise<any[]> {
  const data = await gw('/v2/orders');
  return Array.isArray(data) ? data : data?.orders || [];
}

export async function cancelOrders(marketIndex?: number): Promise<any> {
  const opts: RequestInit = {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  };
  if (marketIndex !== undefined) {
    opts.body = JSON.stringify({ marketIndex, marketType: 'perp' });
  }
  return gw('/v2/orders', opts);
}

export async function confirmTx(signature: string): Promise<any> {
  return gw(`/v2/transactionEvent/${signature}`);
}

export async function placeStopOrder(
  marketIndex: number,
  triggerPrice: number,
  amount: number,
  direction: 'long' | 'short',
  orderType: 'stopLoss' | 'takeProfit'
): Promise<any> {
  const signedAmount = direction === 'short' ? -Math.abs(amount) : Math.abs(amount);
  const triggerCondition = orderType === 'stopLoss'
    ? (direction === 'long' ? 'below' : 'above')
    : (direction === 'long' ? 'above' : 'below');
  return gw('/v2/orders', {
    method: 'POST',
    body: JSON.stringify({
      orders: [{
        marketIndex,
        marketType: 'perp',
        amount: signedAmount,
        orderType: 'triggerMarket',
        triggerPrice: String(triggerPrice),
        triggerCondition,
        reduceOnly: true,
      }],
    }),
  });
}

export async function isGatewayAvailable(): Promise<boolean> {
  try {
    await fetch(`${GATEWAY}/v2/markets`, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}
