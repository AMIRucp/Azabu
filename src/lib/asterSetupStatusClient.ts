import { asterWalletHeaders } from "@/lib/asterClientHeaders";
import type { AsterSetupStatus } from "@/lib/asterSetupStatus";

export async function fetchAsterSetupStatus(walletAddress: string): Promise<AsterSetupStatus | null> {
  try {
    const res = await fetch(
      `/api/aster/setup-status?userAddress=${encodeURIComponent(walletAddress)}`,
      {
        headers: asterWalletHeaders(walletAddress),
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      }
    );
    const data = (await res.json().catch(() => null)) as AsterSetupStatus | { error?: string } | null;
    if (!res.ok || !data || typeof data !== "object" || !("user" in data)) {
      return null;
    }
    return data as AsterSetupStatus;
  } catch {
    return null;
  }
}
