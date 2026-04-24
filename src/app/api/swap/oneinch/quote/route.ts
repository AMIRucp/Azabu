import { NextRequest, NextResponse } from "next/server";
import { fusionSwapService } from "@/services/fusionSwapService";

// Helper to convert BigInt to string for JSON serialization
function serializeBigInt(obj: any): any {
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map(serializeBigInt);
    }
    const result: any = {};
    for (const key in obj) {
      result[key] = serializeBigInt(obj[key]);
    }
    return result;
  }
  return obj;
}

const g = globalThis as any;
if (!g._quoteCache) g._quoteCache = new Map<string, { data: any; ts: number }>();
const QUOTE_CACHE = g._quoteCache as Map<string, { data: any; ts: number }>;
const QUOTE_CACHE_TTL = 10 * 1000;

function getQuoteCacheKey(params: { fromTokenAddress: string; toTokenAddress: string; amount: string; chainId: number; preset?: string }): string {
  return `${params.chainId}:${params.fromTokenAddress}:${params.toTokenAddress}:${params.amount}:${params.preset || 'fast'}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { fromTokenAddress, toTokenAddress, amount, walletAddress, chainId, preset } = body;

    if (!fromTokenAddress || !toTokenAddress || !amount || !walletAddress || !chainId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const cacheKey = getQuoteCacheKey({ fromTokenAddress, toTokenAddress, amount, chainId: Number(chainId), preset });
    const cached = QUOTE_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < QUOTE_CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, max-age=10",
          "X-Cache": "HIT",
        },
      });
    }

    const quote = await fusionSwapService.getQuote({
      fromTokenAddress, 
      toTokenAddress, 
      amount, 
      walletAddress, 
      chainId: Number(chainId),
      preset: preset || "fast",
    });
    
    const serializedQuote = serializeBigInt(quote);

    QUOTE_CACHE.set(cacheKey, { data: serializedQuote, ts: Date.now() });

    if (QUOTE_CACHE.size > 50) {
      const entries = Array.from(QUOTE_CACHE.entries());
      entries.sort((a, b) => a[1].ts - b[1].ts);
      entries.slice(0, entries.length - 50).forEach(([key]) => QUOTE_CACHE.delete(key));
    }

    return NextResponse.json(serializedQuote, {
      headers: {
        "Cache-Control": "public, max-age=10",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
