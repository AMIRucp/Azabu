import { asterWeb3SignInMessage } from "@/lib/asterWeb3CreateApiKey";

type Pending = {
  nonce: string;
  message: string;
  createdAt: number;
};

const pendingByWallet = new Map<string, Pending>();
const TTL_MS = 120_000;

function walletKey(wallet: string): string {
  return wallet.trim().toLowerCase();
}

export function stashAsterWeb3Nonce(wallet: string, nonce: string): { message: string } {
  const message = asterWeb3SignInMessage(nonce);
  pendingByWallet.set(walletKey(wallet), { nonce, message, createdAt: Date.now() });
  return { message };
}

export function takeAsterWeb3Nonce(wallet: string): Pending | null {
  const entry = pendingByWallet.get(walletKey(wallet));
  if (!entry) return null;
  pendingByWallet.delete(walletKey(wallet));
  if (Date.now() - entry.createdAt > TTL_MS) return null;
  return entry;
}

export function peekAsterWeb3Nonce(wallet: string): Pending | null {
  const entry = pendingByWallet.get(walletKey(wallet));
  if (!entry) return null;
  if (Date.now() - entry.createdAt > TTL_MS) {
    pendingByWallet.delete(walletKey(wallet));
    return null;
  }
  return entry;
}
