import axios from 'axios';

const API_KEY = process.env.JUPITER_API_KEY;

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};

if (API_KEY) {
  headers['x-api-key'] = API_KEY;
}

const RECURRING_BASE = 'https://api.jup.ag/recurring/v1';

export interface CreateDCAParams {
  userPublicKey: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  inAmountPerCycle: string;
  cycleSecondsApart: number;
  minOutAmountPerCycle?: string;
  maxOutAmountPerCycle?: string;
  startAt?: number;
}

export interface DCAOrder {
  publicKey: string;
  user: string;
  inputMint: string;
  outputMint: string;
  inDeposited: string;
  inUsed: string;
  outReceived: string;
  cycleFrequency: number;
  nextCycleAt: number;
  createdAt: string;
  status?: string;
}

export async function createDCA(params: CreateDCAParams): Promise<any> {
  const res = await axios.post(`${RECURRING_BASE}/createOrder`, {
    user: params.userPublicKey,
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    params: {
      inAmount: params.inAmount,
      inAmountPerCycle: params.inAmountPerCycle,
      cycleSecondsApart: params.cycleSecondsApart,
      minOutAmountPerCycle: params.minOutAmountPerCycle || null,
      maxOutAmountPerCycle: params.maxOutAmountPerCycle || null,
      startAt: params.startAt || null,
    },
    computeUnitPrice: 'auto',
  }, { headers, timeout: 8000 });
  return res.data;
}

export async function executeDCA(signedTransaction: string, requestId: string): Promise<any> {
  const res = await axios.post(`${RECURRING_BASE}/execute`, {
    signedTransaction,
    requestId,
  }, { headers, timeout: 15000 });
  return res.data;
}

export async function getRecurringOrders(userPublicKey: string): Promise<DCAOrder[]> {
  const res = await axios.get(
    `${RECURRING_BASE}/getRecurringOrders?user=${userPublicKey}`,
    { headers, timeout: 8000 }
  );
  return res.data?.orders || res.data || [];
}

export async function cancelDCA(userPublicKey: string, orderAccount: string): Promise<any> {
  const res = await axios.post(`${RECURRING_BASE}/cancelOrder`, {
    user: userPublicKey,
    order: orderAccount,
    computeUnitPrice: 'auto',
  }, { headers, timeout: 8000 });
  return res.data;
}

export function parseFrequencySeconds(frequency: string): number {
  switch (frequency.toLowerCase()) {
    case 'minute': return 60;
    case 'hourly': case 'hour': return 3600;
    case 'daily': case 'day': return 86400;
    case 'weekly': case 'week': return 604800;
    case 'monthly': case 'month': return 2592000;
    default: return 86400;
  }
}

export function formatFrequency(seconds: number): string {
  if (seconds <= 60) return 'every minute';
  if (seconds <= 3600) return 'every hour';
  if (seconds <= 86400) return 'every day';
  if (seconds <= 604800) return 'every week';
  return 'every month';
}
