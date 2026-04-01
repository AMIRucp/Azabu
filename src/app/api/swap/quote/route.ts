import { NextRequest, NextResponse } from "next/server";
import { JUPITER_PLATFORM_FEE_BPS } from "@/config/integratorFees";

const JUP_API = "https://api.jup.ag/swap/v1";
const API_KEY = process.env.JUPITER_API_KEY || "";

const ALLOWED_PARAMS = new Set([
  "inputMint", "outputMint", "amount", "slippageBps", "swapMode",
  "onlyDirectRoutes", "asLegacyTransaction", "platformFeeBps",
  "maxAccounts", "autoSlippage", "autoSlippageCollisionUsdValue",
  "restrictIntermediateTokens", "excludeDexes", "dexes",
]);

export async function GET(req: NextRequest) {
  try {
    const filtered = new URLSearchParams();
    for (const [key, value] of req.nextUrl.searchParams) {
      if (ALLOWED_PARAMS.has(key) && value.length <= 200) {
        filtered.set(key, value);
      }
    }

    // Inject integrator platform fee if configured and client hasn't set one
    if (JUPITER_PLATFORM_FEE_BPS > 0 && !filtered.has("platformFeeBps")) {
      filtered.set("platformFeeBps", String(JUPITER_PLATFORM_FEE_BPS));
    }

    const res = await fetch(`${JUP_API}/quote?${filtered.toString()}`, {
      headers: API_KEY ? { "x-api-key": API_KEY } : {},
    });
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "Quote fetch failed" }, { status: 502 });
  }
}
