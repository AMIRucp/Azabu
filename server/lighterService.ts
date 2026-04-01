import { ethers } from 'ethers';

const BASE_URL = process.env.LIGHTER_BASE_URL || 'https://mainnet.zklighter.elliot.ai';

export interface LighterCredentials {
  publicKey: string;
  privateKey: string;
  walletAddress: string;
}

export function getLighterCredentials(): LighterCredentials | null {
  const publicKey = process.env.LIGHTER_ETH_PUBLIC_KEY;
  const privateKey = process.env.LIGHTER_ETH_PRIVATE;
  const walletAddress = process.env.LIGHTER_WALLET_ADDRESS;
  if (!publicKey || !privateKey || !walletAddress) return null;
  return { publicKey, privateKey, walletAddress };
}

async function signLighterRequest(
  method: string,
  path: string,
  body: Record<string, any> | null,
  privateKey: string
): Promise<Record<string, string>> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyStr = body ? JSON.stringify(body) : '';
  const message = `${method.toUpperCase()}\n${path}\n${timestamp}\n${bodyStr}`;

  const wallet = new ethers.Wallet(privateKey);
  const signature = await wallet.signMessage(message);

  return {
    'X-Lighter-Timestamp': timestamp,
    'X-Lighter-Signature': signature,
    'Content-Type': 'application/json',
  };
}

export async function lighterRequest(
  method: 'GET' | 'POST' | 'DELETE',
  endpoint: string,
  body: Record<string, any> | null,
  creds: LighterCredentials
): Promise<any> {
  const headers = await signLighterRequest(method, endpoint, body, creds.privateKey);

  const url = `${BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      ...headers,
      'X-Lighter-Address': creds.walletAddress,
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(10000) });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.message || err.error || JSON.stringify(err) || 'Unknown error';
    throw new Error(`Lighter API ${res.status}: ${detail}`);
  }

  return res.json();
}

export async function fetchLighterMarketData(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/v1/orderBookDetails`, {
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Lighter markets fetch failed: ${res.status}`);
  return res.json();
}

export async function submitLighterOrder(
  creds: LighterCredentials,
  marketTicker: string,
  side: 'buy' | 'sell',
  size: string,
  orderType: 'market' | 'limit' = 'market',
  price?: string
): Promise<any> {
  const body: Record<string, any> = {
    market: marketTicker,
    side,
    size,
    orderType,
  };
  if (orderType === 'limit' && price) {
    body.price = price;
  }

  return lighterRequest('POST', '/api/orderbook/v1/order', body, creds);
}

export async function cancelLighterOrder(
  creds: LighterCredentials,
  orderId: string,
  marketTicker: string
): Promise<any> {
  return lighterRequest('DELETE', `/api/orderbook/v1/order/${orderId}`, { market: marketTicker }, creds);
}
