import { ASTER_WALLET_HEADER } from "@/lib/asterApiUser";

export function resolveAsterTradingUser(
  connectedWallet: string | null | undefined,
  fallbackUserId?: string | null,
): string | undefined {
  const live = connectedWallet?.trim();
  if (live) return live;
  const fallback = fallbackUserId?.trim();
  return fallback || undefined;
}

export function asterWalletHeaders(wallet: string | null | undefined): Record<string, string> {
  if (!wallet?.trim()) return {};
  return { [ASTER_WALLET_HEADER]: wallet.trim() };
}
