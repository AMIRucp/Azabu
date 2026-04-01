import { getHeliusApiKey } from './rpc';
import { storage } from './storage';
import { getSwapOrder } from './jupiter';
import { getCached, setCache } from './cache';

export interface DetectedSwap {
  signature: string;
  timestamp: number;
  fromToken: string;
  fromSymbol: string;
  toToken: string;
  toSymbol: string;
  fromAmount: number;
  toAmount: number;
  source: string;
}

const JUPITER_PROGRAM = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
const JUPITER_V6 = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
const JUPITER_AGGREGATOR_V4 = 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcPX7s';

const TOKEN_NAMES: Record<string, string> = {
  'So11111111111111111111111111111111111111112': 'SOL',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'JUP',
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': 'ETH',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'jitoSOL',
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': 'bSOL',
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 'WIF',
  'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ': 'DUST',
  'RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a': 'RLBB',
  '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr': 'POPCAT',
};

async function resolveTokenSymbol(mint: string): Promise<string> {
  if (TOKEN_NAMES[mint]) return TOKEN_NAMES[mint];
  try {
    const apiKey = getHeliusApiKey();
    if (!apiKey) return mint.slice(0, 6) + '...';
    const cacheKey = `token_meta_${mint}`;
    const cached = getCached<string>(cacheKey, 3600_000);
    if (cached) return cached;
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'getAsset',
        params: { id: mint },
      }),
    });
    const data = await res.json();
    const symbol = data?.result?.content?.metadata?.symbol || mint.slice(0, 6);
    setCache(cacheKey, symbol);
    return symbol;
  } catch {
    return mint.slice(0, 6);
  }
}

export async function getRecentSwaps(targetWallet: string, afterSig?: string | null): Promise<DetectedSwap[]> {
  const apiKey = getHeliusApiKey();
  if (!apiKey) return [];

  try {
    const url = `https://api-mainnet.helius-rpc.com/v0/addresses/${targetWallet}/transactions?api-key=${apiKey}&type=SWAP&limit=10`;
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) return [];
    const txns = await response.json();
    if (!Array.isArray(txns) || txns.length === 0) return [];

    const swaps: DetectedSwap[] = [];

    for (const tx of txns) {
      if (afterSig && tx.signature === afterSig) break;

      if (tx.type !== 'SWAP' || tx.transactionError) continue;

      const tokenTransfers = tx.tokenTransfers || [];
      const nativeTransfers = tx.nativeTransfers || [];

      let fromToken = '', toToken = '', fromAmount = 0, toAmount = 0;

      const sent = tokenTransfers.filter((t: any) => t.fromUserAccount === targetWallet);
      const received = tokenTransfers.filter((t: any) => t.toUserAccount === targetWallet);

      const nativeSent = nativeTransfers.filter((t: any) => t.fromUserAccount === targetWallet);
      const nativeReceived = nativeTransfers.filter((t: any) => t.toUserAccount === targetWallet);

      if (sent.length > 0 && received.length > 0) {
        fromToken = sent[0].mint;
        fromAmount = sent[0].tokenAmount;
        toToken = received[0].mint;
        toAmount = received[0].tokenAmount;
      } else if (sent.length > 0 && nativeReceived.length > 0) {
        fromToken = sent[0].mint;
        fromAmount = sent[0].tokenAmount;
        toToken = 'So11111111111111111111111111111111111111112';
        toAmount = nativeReceived.reduce((s: number, t: any) => s + (t.amount / 1e9), 0);
      } else if (nativeSent.length > 0 && received.length > 0) {
        fromToken = 'So11111111111111111111111111111111111111112';
        fromAmount = nativeSent.reduce((s: number, t: any) => s + (t.amount / 1e9), 0);
        toToken = received[0].mint;
        toAmount = received[0].tokenAmount;
      } else {
        continue;
      }

      if (fromAmount <= 0 || toAmount <= 0) continue;

      const [fromSymbol, toSymbol] = await Promise.all([
        resolveTokenSymbol(fromToken),
        resolveTokenSymbol(toToken),
      ]);

      swaps.push({
        signature: tx.signature,
        timestamp: tx.timestamp * 1000,
        fromToken, fromSymbol, toToken, toSymbol,
        fromAmount, toAmount,
        source: tx.source || 'Jupiter',
      });
    }

    return swaps;
  } catch (err: any) {
    console.error('Copy trade scan error:', err.message);
    return [];
  }
}

export async function buildCopySwapQuote(
  swap: DetectedSwap,
  scale: number,
  userWallet: string
): Promise<{ quote: any; swap: DetectedSwap; scaledAmount: number } | null> {
  try {
    const scaledAmount = swap.fromAmount * scale;
    if (scaledAmount <= 0) return null;

    const quote = await getSwapOrder({
      inputMint: swap.fromToken,
      outputMint: swap.toToken,
      amount: String(Math.round(scaledAmount)),
      taker: userWallet,
    });

    if (!quote) return null;

    return { quote, swap, scaledAmount };
  } catch (err: any) {
    console.error('Copy swap quote error:', err.message);
    return null;
  }
}

export async function checkCopyTrades(walletAddress: string): Promise<{
  detectedSwaps: DetectedSwap[];
  copyTradeId: number;
  targetWallet: string;
  scale: number;
}[]> {
  const activeTrades = await storage.getCopyTrades(walletAddress);
  const active = activeTrades.filter(ct => ct.active);
  const results: { detectedSwaps: DetectedSwap[]; copyTradeId: number; targetWallet: string; scale: number }[] = [];

  for (const ct of active) {
    const swaps = await getRecentSwaps(ct.targetWallet, ct.lastCheckedSig);
    if (swaps.length > 0) {
      await storage.updateCopyTradeLastSig(ct.id, swaps[0].signature);
    }
    if (swaps.length > 0) {
      results.push({
        detectedSwaps: swaps,
        copyTradeId: ct.id,
        targetWallet: ct.targetWallet,
        scale: parseFloat(ct.scale || '1'),
      });
    }
  }

  return results;
}

export function formatSwapSummary(swap: DetectedSwap, scale: number): string {
  const scaledAmt = (swap.fromAmount * scale).toFixed(4);
  const timeAgo = Math.floor((Date.now() - swap.timestamp) / 60000);
  const timeStr = timeAgo < 1 ? 'just now' : timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo / 60)}h ago`;
  return `${swap.fromSymbol} -> ${swap.toSymbol}: ${swap.fromAmount.toFixed(4)} ${swap.fromSymbol} (your size: ${scaledAmt} ${swap.fromSymbol}) -- ${timeStr}`;
}
