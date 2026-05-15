import { asterFapiServerTimeUrl } from "@/config/asterFapi";

let offsetMs = 0;
let validUntilLocal = 0;

export async function asterSyncedNowMs(options?: { force?: boolean }): Promise<number> {
  const force = options?.force === true;
  const local = Date.now();
  if (!force && local < validUntilLocal) {
    return local + offsetMs;
  }
  try {
    const res = await fetch(asterFapiServerTimeUrl(), {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { serverTime?: number };
    const serverTime = typeof data.serverTime === "number" ? data.serverTime : local;
    offsetMs = serverTime - local;
    validUntilLocal = local + 30_000;
    return serverTime;
  } catch {
    validUntilLocal = local + 5_000;
    return local;
  }
}

export function isLikelyAsterClockSkewError(msg: string, code?: number): boolean {
  if (code === -1021) return true;
  const t = msg.toLowerCase();
  return (
    t.includes("timestamp") ||
    t.includes("recvwindow") ||
    t.includes("recv window") ||
    t.includes("device time") ||
    t.includes("outside of the") ||
    t.includes("ahead of the server")
  );
}

let _nonceLastSec = -1;
let _nonceSeq = 0;

export function nextAsterAuthNonceV3(serverAlignedMs: number): string {
  const sec = Math.floor(serverAlignedMs / 1000);
  if (sec === _nonceLastSec) {
    _nonceSeq += 1;
  } else {
    _nonceLastSec = sec;
    _nonceSeq = 0;
  }
  return (sec * 1_000_000 + _nonceSeq).toString();
}
