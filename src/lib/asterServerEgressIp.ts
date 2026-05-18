import type { NextRequest } from "next/server";

let cached: { ip: string; at: number } | null = null;
const TTL_MS = 60_000;

/** Server egress IP for Aster agent ipWhitelist (single address). */
export async function resolveAsterServerEgressIp(request?: NextRequest): Promise<string> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.ip;

  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const data = (await res.json()) as { ip?: string };
    if (typeof data.ip === "string" && data.ip.trim()) {
      cached = { ip: data.ip.trim(), at: Date.now() };
      return cached.ip;
    }
  } catch {
    /* fall through */
  }

  if (request) {
    const fromHeader =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip")?.trim() ||
      "";
    if (fromHeader && fromHeader !== "unknown") return fromHeader;
  }

  const first = process.env.ASTER_IP_WHITELIST?.trim().split(",")[0]?.trim();
  return first || "";
}
