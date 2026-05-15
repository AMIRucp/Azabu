import { ASTER_WALLET_HEADER } from "@/lib/asterApiUser";

export function asterWalletHeaders(wallet: string | null | undefined): Record<string, string> {
  if (!wallet?.trim()) return {};
  return { [ASTER_WALLET_HEADER]: wallet.trim() };
}
