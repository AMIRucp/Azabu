import { NextRequest, NextResponse } from "next/server";

const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY;
const REQUEST_TIMEOUT = 10000;
const MAX_RETRIES = 2;

const g = globalThis as any;
if (!g._tokenCache) g._tokenCache = new Map<string, { data: any; ts: number }>();
const TOKEN_CACHE = g._tokenCache as Map<string, { data: any; ts: number }>;
const CACHE_TTL = 60 * 60 * 1000;

interface TokenListResponse {
  tokens?: Record<string, any>;
  error?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chainId = searchParams.get("chainId") || "1";

  if (!isValidChainId(chainId)) {
    return NextResponse.json({ error: "Invalid chain ID" }, { status: 400 });
  }

  if (!ONEINCH_API_KEY) {
    return NextResponse.json({ error: "API configuration error" }, { status: 500 });
  }

  const cached = TOKEN_CACHE.get(chainId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const data = await fetchTokensWithRetry(chainId, MAX_RETRIES);
    
    if (!data.tokens || typeof data.tokens !== "object") {
      throw new Error("Invalid response structure from 1inch API");
    }

    TOKEN_CACHE.set(chainId, { data, ts: Date.now() });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    if (cached) {
      return NextResponse.json(cached.data, {
        headers: { "Cache-Control": "public, max-age=300", "X-Cache": "STALE" },
      });
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch token list", details: errorMessage }, { status: 500 });
  }
}

async function fetchTokensWithRetry(
  chainId: string,
  retriesLeft: number
): Promise<TokenListResponse> {
  try {
    const url = new URL(`https://api.1inch.com/token/v1.4/${chainId}/token-list`);
    url.searchParams.append("provider", "1inch");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${ONEINCH_API_KEY}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`1inch API returned ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (retriesLeft > 0) {
      const delay = Math.pow(2, MAX_RETRIES - retriesLeft) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchTokensWithRetry(chainId, retriesLeft - 1);
    }

    throw error;
  }
}

function isValidChainId(chainId: string): boolean {
  const validChains = ["1", "42161"];
  return validChains.includes(chainId);
}