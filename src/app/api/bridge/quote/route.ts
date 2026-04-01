import { NextRequest, NextResponse } from "next/server";

const FUSION_PLUS_API = "https://api.1inch.dev/fusion-plus";
const VALID_CHAIN_IDS = new Set(["1", "42161", "8453"]);
const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export async function GET(req: NextRequest) {
  const srcChain = req.nextUrl.searchParams.get("srcChain");
  const dstChain = req.nextUrl.searchParams.get("dstChain");
  const srcToken = req.nextUrl.searchParams.get("srcToken");
  const dstToken = req.nextUrl.searchParams.get("dstToken");
  const amount = req.nextUrl.searchParams.get("amount");
  const walletAddress = req.nextUrl.searchParams.get("walletAddress");

  if (!srcChain || !dstChain || !srcToken || !dstToken || !amount || !walletAddress) {
    return NextResponse.json(
      { error: "srcChain, dstChain, srcToken, dstToken, amount, walletAddress required" },
      { status: 400 }
    );
  }

  if (!VALID_CHAIN_IDS.has(srcChain) || !VALID_CHAIN_IDS.has(dstChain)) {
    return NextResponse.json({ error: "Unsupported chain" }, { status: 400 });
  }

  const isValidAddr = (a: string) => ETH_ADDRESS_RE.test(a) || a.toLowerCase() === NATIVE_ETH.toLowerCase();
  if (!isValidAddr(srcToken) || !isValidAddr(dstToken) || !ETH_ADDRESS_RE.test(walletAddress)) {
    return NextResponse.json({ error: "Invalid address format" }, { status: 400 });
  }

  if (!/^\d+$/.test(amount) || BigInt(amount) <= 0n) {
    return NextResponse.json({ error: "Amount must be a positive integer" }, { status: 400 });
  }

  const apiKey = process.env.ONEINCH_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Bridge service not configured" }, { status: 503 });
  }

  try {
    const params = new URLSearchParams({
      srcChainId: srcChain,
      dstChainId: dstChain,
      srcTokenAddress: srcToken,
      dstTokenAddress: dstToken,
      amount,
      walletAddress,
      enableEstimate: "true",
    });

    const res = await fetch(
      `${FUSION_PLUS_API}/quoter/v2.0/quote/receive?${params}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("[BRIDGE QUOTE]", res.status, text);

      if (res.status === 400) {
        return NextResponse.json({ error: "Invalid bridge parameters. Check token addresses and amounts." }, { status: 400 });
      }
      return NextResponse.json({ error: "Bridge quote failed" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return NextResponse.json({ error: "Quote service timed out" }, { status: 504 });
    }
    console.error("[BRIDGE QUOTE] error:", err);
    return NextResponse.json({ error: "Bridge quote service error" }, { status: 500 });
  }
}
