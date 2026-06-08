import { NextRequest, NextResponse } from "next/server";
import { getBridgeEvmChain, isFusionPlusEvmChain } from "@/config/bridgeEvmChains";

const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY;
const CACHE_TTL = 60 * 60 * 1000;

const g = globalThis as typeof globalThis & {
  _bridgeTokenCache?: Map<string, { data: unknown; ts: number }>;
};
if (!g._bridgeTokenCache) g._bridgeTokenCache = new Map();

export async function GET(request: NextRequest) {
  const chainId = request.nextUrl.searchParams.get("chainId");
  if (!chainId || !isFusionPlusEvmChain(Number(chainId))) {
    return NextResponse.json({ error: "Invalid chainId" }, { status: 400 });
  }

  const chain = getBridgeEvmChain(Number(chainId));
  if (!chain) {
    return NextResponse.json({ error: "Unknown chain" }, { status: 400 });
  }

  const cached = g._bridgeTokenCache!.get(chainId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data, { headers: { "X-Cache": "HIT" } });
  }

  if (!ONEINCH_API_KEY) {
    return NextResponse.json({
      tokens: Object.fromEntries(
        chain.fallbackTokens.map((t) => [t.address.toLowerCase(), { ...t, logoURI: t.logoURI }]),
      ),
      source: "fallback",
    });
  }

  try {
    const url = new URL(`https://api.1inch.com/token/v1.4/${chainId}/token-list`);
    url.searchParams.append("provider", "1inch");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${ONEINCH_API_KEY}`, Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) throw new Error(`1inch tokens ${res.status}`);

    const data = await res.json();
    g._bridgeTokenCache!.set(chainId, { data, ts: Date.now() });

    return NextResponse.json(data, { headers: { "X-Cache": "MISS" } });
  } catch {
    const fallback = {
      tokens: Object.fromEntries(
        chain.fallbackTokens.map((t) => [
          t.address.toLowerCase(),
          {
            symbol: t.symbol,
            name: t.name,
            address: t.address,
            decimals: t.decimals,
            logoURI: t.logoURI,
          },
        ]),
      ),
      source: "fallback",
    };
    return NextResponse.json(fallback);
  }
}
