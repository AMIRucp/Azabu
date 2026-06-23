export type OneInchTokenRecord = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
};

/** 1inch sometimes returns bytes32 symbols as hex (e.g. MKR → 0x4d4b52…0000). */
export function sanitizeTokenSymbol(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const hexBody = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  if (/^[0-9a-fA-F]{32,}$/.test(hexBody)) {
    try {
      const bytes = Uint8Array.from(
        hexBody.match(/.{1,2}/g) ?? [],
        (byte) => parseInt(byte, 16),
      );
      const decoded = new TextDecoder()
        .decode(bytes)
        .replace(/\0/g, "")
        .trim();
      if (decoded.length > 0 && decoded.length <= 16 && /^[\x20-\x7E]+$/.test(decoded)) {
        return decoded.toUpperCase();
      }
    } catch {
      /* fall through */
    }
  }

  if (/^0x[0-9a-fA-F]{40}$/i.test(trimmed)) {
    return trimmed.slice(2, 6).toUpperCase();
  }

  if (trimmed.length > 16) {
    return trimmed.slice(0, 16).toUpperCase();
  }

  return trimmed.toUpperCase();
}

const ONEINCH_CDN = "https://tokens.1inch.io/v1.2";

export function normalizeOneInchTokenMap(data: unknown): Record<string, OneInchTokenRecord> {
  const raw =
    data && typeof data === "object" && "tokens" in data && (data as { tokens?: unknown }).tokens
      ? (data as { tokens: unknown }).tokens
      : data;

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const out: Record<string, OneInchTokenRecord> = {};
  for (const [key, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") continue;
    const t = entry as Record<string, unknown>;
    const address = String(t.address || key).toLowerCase();
    const symbol = sanitizeTokenSymbol(String(t.symbol || ""));
    if (!symbol || !address) continue;
    out[address] = {
      symbol,
      name: String(t.name || symbol).replace(/\0/g, "").trim() || symbol,
      address,
      decimals: Number(t.decimals) || 18,
      logoURI: t.logoURI ? String(t.logoURI) : undefined,
    };
  }
  return out;
}

export async function fetchOneInchTokenListFromCdn(
  chainId: number,
): Promise<Record<string, OneInchTokenRecord>> {
  const res = await fetch(`${ONEINCH_CDN}/${chainId}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`1inch token CDN ${res.status}`);
  const data = await res.json();
  const tokens = normalizeOneInchTokenMap(data);
  if (Object.keys(tokens).length === 0) {
    throw new Error("1inch token CDN returned empty list");
  }
  return tokens;
}

export async function fetchOneInchTokenListFromApi(
  chainId: number,
  apiKey: string,
): Promise<Record<string, OneInchTokenRecord>> {
  const url = new URL(`https://api.1inch.com/token/v1.4/${chainId}/token-list`);
  url.searchParams.set("provider", "1inch");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`1inch token API ${res.status}`);
  const data = await res.json();
  const tokens = normalizeOneInchTokenMap(data);
  if (Object.keys(tokens).length === 0) {
    throw new Error("1inch token API returned empty list");
  }
  return tokens;
}
