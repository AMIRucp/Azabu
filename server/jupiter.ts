import axios from 'axios';
import { TOKEN_REGISTRY as EXT_TOKEN_REGISTRY, STOCK_ALIASES } from './tokenRegistry';
import { RWA_BY_SYMBOL, RWA_BY_ALIAS, RWA_BY_MINT } from './rwa/tokens';
const API_KEY = process.env.JUPITER_API_KEY;

if (!API_KEY) {
  console.warn('JUPITER_API_KEY is not set - Jupiter API calls will fail');
}

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};

if (API_KEY) {
  headers['x-api-key'] = API_KEY;
}

const AXIOS_TIMEOUT = 8000;

const ULTRA_BASE = 'https://api.jup.ag/ultra/v1';
const TRIGGER_BASE = 'https://api.jup.ag/trigger/v1';
const PRICE_BASE = 'https://api.jup.ag/price/v3';
const TOKEN_BASE = 'https://api.jup.ag/tokens/v1';

interface TokenEntry {
  mint: string;
  decimals: number;
  name: string;
  verified: boolean;
}

export const AFX_TOKEN_REGISTRY: Record<string, TokenEntry> = {
  SOL:     { mint:"So11111111111111111111111111111111111111112",    decimals:9,  name:"Solana",               verified:true  },
  WSOL:    { mint:"So11111111111111111111111111111111111111112",    decimals:9,  name:"Wrapped SOL",          verified:true  },
  USDC:    { mint:"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals:6,  name:"USD Coin",             verified:true  },
  USDT:    { mint:"Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals:6,  name:"Tether USD",           verified:true  },
  BONK:    { mint:"DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", decimals:5,  name:"Bonk",                 verified:true  },
  WIF:     { mint:"EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", decimals:6,  name:"dogwifhat",            verified:true  },
  JUP:     { mint:"JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",  decimals:6,  name:"Jupiter",              verified:true  },
  JTO:     { mint:"jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",  decimals:9,  name:"Jito",                 verified:true  },
  PYTH:    { mint:"HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3", decimals:6,  name:"Pyth Network",         verified:true  },
  RAY:     { mint:"4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", decimals:6,  name:"Raydium",              verified:true  },
  ORCA:    { mint:"orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",  decimals:6,  name:"Orca",                 verified:true  },
  MSOL:    { mint:"mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",  decimals:9,  name:"Marinade staked SOL",  verified:true  },
  JITOSOL: { mint:"J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn", decimals:9,  name:"Jito Staked SOL",      verified:true  },
  RENDER:  { mint:"rndrizKT3MK1iimdxRdTEMQvmgzmNY3Z7GZABGPCZQ",   decimals:8,  name:"Render",               verified:true  },
  RNDR:    { mint:"rndrizKT3MK1iimdxRdTEMQvmgzmNY3Z7GZABGPCZQ",   decimals:8,  name:"Render",               verified:true  },
  BTC:     { mint:"3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh", decimals:8,  name:"Wrapped BTC",          verified:true  },
  WBTC:    { mint:"3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh", decimals:8,  name:"Wrapped BTC",          verified:true  },
  ETH:     { mint:"7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs", decimals:8,  name:"Wrapped ETH",          verified:true  },
  WETH:    { mint:"7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs", decimals:8,  name:"Wrapped ETH",          verified:true  },
  PAXG:    { mint:"CpMah17kLowWgMgZJvHGJLMkseGm1bFMbg5xmGCsU7rm", decimals:8,  name:"PAX Gold",             verified:true  },
  OUSG:    { mint:"rRsXLHe7sBHdyKU3KY3wbcSWXDwkpuARMQRFQBJFfjU",  decimals:6,  name:"Ondo US Treasury",     verified:true  },
  USDY:    { mint:"A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6",  decimals:6,  name:"Ondo US Dollar Yield", verified:true  },
  NVDA:    { mint:"4GFYuXjtajsMeFCECfBRXKwJnEJBo9oNSAEtF2A7X2kq",  decimals:8,  name:"NVIDIA (xStock)",      verified:false },
  AAPL:    { mint:"GJH9BCkDSoFGBkiCEZFnQNk2cHEXHxmLJqSM8M5JiYRG",  decimals:8,  name:"Apple (xStock)",       verified:false },
  MSFT:    { mint:"PLACEHOLDER_MSFT",                                decimals:8,  name:"Microsoft (xStock)",   verified:false },
  GOOGL:   { mint:"2ZUrGKSBcQbzM7dJSy8FH3W6EhNEtBREWjTrDhP3sxEb",  decimals:8,  name:"Alphabet (xStock)",    verified:false },
  META:    { mint:"5FbEy6HFqHVHMT4XFHF7kM9VDzJFjXLYqNJ7RqLvmGT",   decimals:8,  name:"Meta (xStock)",        verified:false },
  AMZN:    { mint:"9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",   decimals:8,  name:"Amazon (xStock)",      verified:false },
  TSLA:    { mint:"8bTkHzFKPjNraNZuXfmFJkHExRTwKL8Jq5Tx7AH3pnjb",  decimals:8,  name:"Tesla (xStock)",       verified:false },
  COIN:    { mint:"2FPyTwcZLUgr5Th81bnTK48BaEE9YxEFUo6PBzRJT8yb",  decimals:8,  name:"Coinbase (xStock)",    verified:false },
  DIS:     { mint:"HZ1JovNiVvGqeR313LwtsDSHvMf8MaLs8Droh8FKRoQ3",  decimals:8,  name:"Disney (xStock)",      verified:false },
  BA:      { mint:"8FRFC6MoGGkio1NudWfwv4UHzDN3SniUHSPUcRQTcbJ5",  decimals:8,  name:"Boeing (xStock)",      verified:false },
  USDe:    { mint:"DEkqHyPN7GMRJ5cArtQFAWefqbZb33Hyf6s5iCwjEonT",  decimals:6,  name:"USDe (Ethena)",        verified:true  },
  FDUSD:   { mint:"9zNQRsGLjNKwCUU5Gq5LR8beUCPzQMVMqKAi3SSZh54u",  decimals:6,  name:"First Digital USD",    verified:true  },
  USDG:    { mint:"2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH",  decimals:6,  name:"Global Dollar",        verified:true  },
  AUSD:    { mint:"AUSD1jCcCyPLybk1YnvPWsHQSrZ46dxwoMniN4N2UEB9",  decimals:6,  name:"Agora USD",            verified:true  },
  sUSD:    { mint:"susdabGDNbhrnCa6ncrYo81u4s9GM8ecK2UwMyZiq4X",    decimals:6,  name:"Solayer USD",          verified:true  },
  cfUSD:   { mint:"9Qh5igeYVb9ZC6s6BfNaffycTiNTqv9KhL432LdqyT4Y",  decimals:6,  name:"cfUSD (Brale)",        verified:true  },
  PST:     { mint:"HUMA1821qVDKta3u2ovmfDQeW2fSQouSKE8fkF44wvGw",  decimals:6,  name:"PST (Huma)",           verified:true  },
  yUSD:    { mint:"yUSDX7W89jXWn4zzDPLnhykDymSjQSmpaJ8e4fjC1fg",   decimals:6,  name:"yUSD (Synatra)",       verified:true  },
};

export const KNOWN_MINTS: Record<string, string> = Object.fromEntries(
  Object.entries(AFX_TOKEN_REGISTRY).map(([s, t]) => [s, t.mint])
);
export const KNOWN_DECIMALS: Record<string, number> = Object.fromEntries(
  Object.entries(AFX_TOKEN_REGISTRY)
    .filter(([, t]) => !t.mint.startsWith("PLACEHOLDER"))
    .map(([, t]) => [t.mint, t.decimals])
);

const RWA_LOCKED_SYMBOLS = new Set(["PAXG","XAUT","OUSG","USDY","WBTC","WETH","OIL","GOLD","SILVER","CORN","WHEAT"]);

export function resolveTokenMint(symbolOrMint: string): string {
  const upper = symbolOrMint.toUpperCase();

  const reg = AFX_TOKEN_REGISTRY[upper] || AFX_TOKEN_REGISTRY[symbolOrMint];
  if (reg && !reg.mint.startsWith("PLACEHOLDER")) return reg.mint;

  if (KNOWN_MINTS[upper] && !KNOWN_MINTS[upper].startsWith("PLACEHOLDER")) return KNOWN_MINTS[upper];

  if (RWA_LOCKED_SYMBOLS.has(upper)) {
    console.warn(`[resolveTokenMint] RWA symbol ${upper} not in KNOWN_MINTS — refusing to guess`);
    return symbolOrMint;
  }

  const aliased = STOCK_ALIASES[upper];
  if (aliased && EXT_TOKEN_REGISTRY[aliased]) return EXT_TOKEN_REGISTRY[aliased].address;
  if (EXT_TOKEN_REGISTRY[upper]) return EXT_TOKEN_REGISTRY[upper].address;

  const rwaBySymbol = RWA_BY_SYMBOL.get(upper);
  if (rwaBySymbol) return rwaBySymbol.mint;
  const rwaByAlias = RWA_BY_ALIAS.get(symbolOrMint.toLowerCase());
  if (rwaByAlias) return rwaByAlias.mint;

  if (symbolOrMint.length > 30) return symbolOrMint;
  return symbolOrMint;
}

export function getTokenSymbol(mint: string): string {
  for (const [symbol, entry] of Object.entries(AFX_TOKEN_REGISTRY)) {
    if (entry.mint === mint) return symbol;
  }
  return mint.slice(0, 4) + '...' + mint.slice(-4);
}

export function getDecimals(mint: string): number {
  if (KNOWN_DECIMALS[mint]) return KNOWN_DECIMALS[mint];
  const rwaToken = RWA_BY_MINT.get(mint);
  if (rwaToken) return rwaToken.decimals;
  return 6;
}

// ============== ULTRA SWAP API ==============

export interface SwapOrderRequest {
  inputMint: string;
  outputMint: string;
  amount: string;
  taker: string;
}

export interface SwapOrderResponse {
  requestId: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
  transaction: string;
}

export interface ExecuteRequest {
  signedTransaction: string;
  requestId: string;
}

export interface ExecuteResponse {
  status: 'Success' | 'Failed';
  signature: string;
  slot?: number;
  code?: string;
  error?: string;
}

export async function getSwapOrder(params: SwapOrderRequest): Promise<SwapOrderResponse> {
  const queryParams = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    taker: params.taker,
  });

  const url = `${ULTRA_BASE}/order?${queryParams.toString()}`;
  const response = await axios.get(url, { headers, timeout: AXIOS_TIMEOUT });
  return response.data;
}

export async function executeSwap(params: ExecuteRequest): Promise<ExecuteResponse> {
  const url = `${ULTRA_BASE}/execute`;
  const response = await axios.post(url, {
    signedTransaction: params.signedTransaction,
    requestId: params.requestId,
  }, { headers, timeout: 15000 });
  return response.data;
}

// ============== HOLDINGS ==============

export async function getHoldings(walletAddress: string): Promise<any> {
  const url = `${ULTRA_BASE}/holdings/${walletAddress}`;
  const response = await axios.get(url, { headers, timeout: AXIOS_TIMEOUT });
  return response.data;
}

// ============== TRIGGER API (LIMIT ORDERS) ==============

export async function createLimitOrder(params: {
  inputMint: string;
  outputMint: string;
  maker: string;
  makingAmount: string;
  takingAmount: string;
  expiredAt?: number | null;
}) {
  const res = await axios.post(`${TRIGGER_BASE}/createOrder`, {
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    maker: params.maker,
    payer: params.maker,
    params: {
      makingAmount: params.makingAmount,
      takingAmount: params.takingAmount,
      expiredAt: params.expiredAt || null,
    },
    computeUnitPrice: 'auto',
  }, { headers, timeout: AXIOS_TIMEOUT });
  return res.data;
}

export async function executeTriggerOrder(signedTransaction: string, requestId: string) {
  const res = await axios.post(`${TRIGGER_BASE}/execute`, {
    signedTransaction,
    requestId,
  }, { headers, timeout: 15000 });
  return res.data;
}

export async function getOrders(maker: string, state = 'active') {
  const res = await axios.get(
    `${TRIGGER_BASE}/getTriggerOrders?maker=${maker}&state=${state}`,
    { headers, timeout: AXIOS_TIMEOUT }
  );
  return res.data;
}

export async function cancelOrder(maker: string, orderAccount: string) {
  const res = await axios.post(`${TRIGGER_BASE}/cancelOrder`, {
    maker,
    order: orderAccount,
    computeUnitPrice: 'auto',
  }, { headers, timeout: AXIOS_TIMEOUT });
  return res.data;
}

export async function cancelAllOrders(maker: string, orderAccounts: string[]) {
  const res = await axios.post(`${TRIGGER_BASE}/cancelOrders`, {
    maker,
    orders: orderAccounts,
    computeUnitPrice: 'auto',
  }, { headers, timeout: AXIOS_TIMEOUT });
  return res.data;
}

// ============== PRICE API V3 ==============

function parsePriceResponse(rawData: Record<string, any>): Record<string, { usdPrice: number; priceChange24h?: number }> {
  const result: Record<string, { usdPrice: number; priceChange24h?: number }> = {};
  for (const [key, val] of Object.entries(rawData)) {
    const v = val as any;
    if (v && (v.price || v.usdPrice)) {
      result[key] = {
        usdPrice: parseFloat(String(v.price || v.usdPrice)),
        priceChange24h: v.priceChange24h,
      };
    }
  }
  return result;
}

const PRICE_BATCH_SIZE = 100;

const jupPriceCache = new Map<string, { data: Record<string, { usdPrice: number; priceChange24h?: number }>; ts: number }>();
const JUP_PRICE_TTL = 10_000;

export async function getTokenPrices(mintAddresses: string[]): Promise<Record<string, { usdPrice: number; priceChange24h?: number }>> {
  if (mintAddresses.length === 0) return {};

  const now = Date.now();
  const uncached: string[] = [];
  const merged: Record<string, { usdPrice: number; priceChange24h?: number }> = {};

  for (const mint of mintAddresses) {
    const cached = jupPriceCache.get(mint);
    if (cached && now - cached.ts < JUP_PRICE_TTL) {
      Object.assign(merged, cached.data);
    } else {
      uncached.push(mint);
    }
  }

  if (uncached.length === 0) return merged;

  const batches: string[][] = [];
  for (let i = 0; i < uncached.length; i += PRICE_BATCH_SIZE) {
    batches.push(uncached.slice(i, i + PRICE_BATCH_SIZE));
  }

  const batchResults = await Promise.allSettled(
    batches.map(batch => fetchPriceBatch(batch))
  );

  for (const r of batchResults) {
    if (r.status === 'fulfilled') {
      for (const [mint, data] of Object.entries(r.value)) {
        jupPriceCache.set(mint, { data: { [mint]: data }, ts: now });
      }
      Object.assign(merged, r.value);
    }
  }
  return merged;
}

async function fetchPriceBatch(mints: string[]): Promise<Record<string, { usdPrice: number; priceChange24h?: number }>> {
  const ids = mints.join(',');
  try {
    const res = await axios.get(`${PRICE_BASE}?ids=${ids}`, { headers, timeout: AXIOS_TIMEOUT });
    const rawData = res.data?.data || res.data || {};
    return parsePriceResponse(rawData);
  } catch (e: any) {
    console.error('Jupiter Price API error:', e.response?.status, e.response?.data || e.message);
    try {
      const res = await axios.get(`https://api.jup.ag/price/v2?ids=${ids}`, { timeout: AXIOS_TIMEOUT });
      const data = res.data?.data || {};
      return parsePriceResponse(data);
    } catch (e2: any) {
      console.error('Jupiter Price V2 fallback error:', e2.response?.status, e2.response?.data || e2.message);
      return {};
    }
  }
}

export async function getTokenPriceBySymbol(symbol: string): Promise<{ usdPrice: number; priceChange24h?: number } | null> {
  const mint = resolveTokenMint(symbol);
  if (!mint || mint === symbol) {
    const searchResult = await searchTokens(symbol);
    if (searchResult && searchResult.length > 0) {
      const firstMint = searchResult[0].address;
      const prices = await getTokenPrices([firstMint]);
      return prices[firstMint] || null;
    }
    return null;
  }
  const prices = await getTokenPrices([mint]);
  return prices[mint] || null;
}


// ============== TOKEN API V2 ==============

export async function getTokenInfo(mint: string): Promise<any> {
  const res = await axios.get(`${TOKEN_BASE}/token/${mint}`, { headers, timeout: AXIOS_TIMEOUT });
  return res.data;
}

export async function searchTokens(query: string): Promise<any[]> {
  const res = await axios.get(`${TOKEN_BASE}/search?query=${encodeURIComponent(query)}`, { headers, timeout: AXIOS_TIMEOUT });
  return res.data || [];
}
