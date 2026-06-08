import { NextRequest, NextResponse } from "next/server";
import { BRIDGE_EVM_CHAINS, getBridgeEvmChain } from "@/config/bridgeEvmChains";
import {
  fetchOneInchTokenListFromApi,
  fetchOneInchTokenListFromCdn,
  type OneInchTokenRecord,
} from "@/lib/oneinchTokenList";

const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY;

const g = globalThis as any;
if (!g._tokenCache) g._tokenCache = new Map<string, { data: any; ts: number; source: string }>();
const TOKEN_CACHE = g._tokenCache as Map<string, { data: any; ts: number; source: string }>;
const CACHE_TTL = 60 * 60 * 1000;
const FALLBACK_CACHE_TTL = 60 * 1000;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chainId = searchParams.get("chainId") || "1";

  if (!isValidChainId(chainId)) {
    return NextResponse.json({ error: "Invalid chain ID" }, { status: 400 });
  }

  const cached = TOKEN_CACHE.get(chainId);
  const ttl = cached?.source === "fallback" ? FALLBACK_CACHE_TTL : CACHE_TTL;
  if (cached && Date.now() - cached.ts < ttl) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Cache": "HIT",
        "X-Token-Source": cached.source,
      },
    });
  }

  try {
    const data = await loadTokensForChain(Number(chainId));

    TOKEN_CACHE.set(chainId, { data, ts: Date.now(), source: data.source });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Cache": "MISS",
        "X-Token-Source": data.source,
      },
    });
  } catch (error) {
    if (cached) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, max-age=300",
          "X-Cache": "STALE",
          "X-Token-Source": cached.source,
        },
      });
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch token list", details: errorMessage }, { status: 500 });
  }
}

function mergeFallbackTokens(
  tokens: Record<string, OneInchTokenRecord>,
  chainId: number,
): Record<string, OneInchTokenRecord> {
  const chain = getBridgeEvmChain(chainId);
  if (!chain) return tokens;
  const merged = { ...tokens };
  for (const t of chain.fallbackTokens) {
    const address = t.address.toLowerCase();
    if (!merged[address]) {
      merged[address] = {
        symbol: t.symbol,
        name: t.name,
        address,
        decimals: t.decimals,
        logoURI: t.logoURI,
      };
    }
  }
  return merged;
}

async function loadTokensForChain(chainId: number): Promise<{ tokens: Record<string, OneInchTokenRecord>; source: string }> {
  let tokens: Record<string, OneInchTokenRecord> | null = null;
  let source = "1inch-cdn";

  try {
    tokens = await fetchOneInchTokenListFromCdn(chainId);
  } catch {
  }

  if (!tokens && ONEINCH_API_KEY) {
    try {
      tokens = await fetchOneInchTokenListFromApi(chainId, ONEINCH_API_KEY);
      source = "1inch-api";
    } catch {
    }
  }

  if (!tokens) {
    return {
      tokens: mergeFallbackTokens({}, chainId),
      source: "fallback",
    };
  }

  return {
    tokens: mergeFallbackTokens(tokens, chainId),
    source,
  };
}

function isValidChainId(chainId: string): boolean {
  const chain = Number(chainId);
  if (!Number.isInteger(chain) || chain <= 0) return false;
  return BRIDGE_EVM_CHAINS.some((c) => c.chainId === chain);
}