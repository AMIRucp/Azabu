import { Connection } from '@solana/web3.js';

const heliusKey = process.env.HELIUS_API_KEY;

export const RPC_URL = heliusKey
  ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
  : (process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com');

if (!heliusKey && !process.env.HELIUS_RPC_URL) {
  console.error('========================================');
  console.error('WARNING: No Helius RPC configured.');
  console.error('Set HELIUS_API_KEY in deployment secrets.');
  console.error('Using public RPC - requests WILL be rate-limited.');
  console.error('========================================');
}

if (RPC_URL.includes('api.mainnet-beta.solana.com')) {
  console.error('WARNING: Using public Solana RPC. Transactions may fail due to rate limits.');
}

export const HELIUS_ENHANCED_API = heliusKey
  ? `https://api-mainnet.helius-rpc.com/v0`
  : '';

let connectionInstance: Connection | null = null;

export function getConnection(commitment: 'confirmed' | 'finalized' = 'confirmed'): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(RPC_URL, {
      commitment,
      confirmTransactionInitialTimeout: 60000,
    });
  }
  return connectionInstance;
}

export function getHeliusApiKey(): string {
  return heliusKey || '';
}

export function getHeliusEnhancedUrl(path: string): string {
  if (!heliusKey) return '';
  return `${HELIUS_ENHANCED_API}${path}?api-key=${heliusKey}`;
}

export function getPublicRpcUrl(): string {
  return heliusKey
    ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
    : 'https://api.mainnet-beta.solana.com';
}
