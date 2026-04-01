import { NextRequest, NextResponse } from "next/server";

const FUSION_PLUS_API = "https://api.1inch.dev/fusion-plus";

const VALID_CHAIN_IDS = new Set([1, 42161, 8453]);
const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

function isValidAddress(addr: string): boolean {
  return ETH_ADDRESS_RE.test(addr) || addr.toLowerCase() === NATIVE_ETH.toLowerCase();
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ONEINCH_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Bridge service not configured" }, { status: 503 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { srcChainId, dstChainId, srcToken, dstToken, amount, walletAddress } = body;

  if (!srcChainId || !dstChainId || !srcToken || !dstToken || !amount || !walletAddress) {
    return NextResponse.json(
      { error: "srcChainId, dstChainId, srcToken, dstToken, amount, walletAddress required" },
      { status: 400 }
    );
  }

  const srcChain = Number(srcChainId);
  const dstChain = Number(dstChainId);
  if (!VALID_CHAIN_IDS.has(srcChain) || !VALID_CHAIN_IDS.has(dstChain)) {
    return NextResponse.json({ error: "Unsupported chain" }, { status: 400 });
  }
  if (!isValidAddress(srcToken) || !isValidAddress(dstToken)) {
    return NextResponse.json({ error: "Invalid token address format" }, { status: 400 });
  }
  if (!ETH_ADDRESS_RE.test(walletAddress)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }
  if (!/^\d+$/.test(String(amount)) || BigInt(amount) <= 0n) {
    return NextResponse.json({ error: "Amount must be a positive integer in atomic units" }, { status: 400 });
  }

  try {
    const quoteParams = new URLSearchParams({
      srcChainId: String(srcChain),
      dstChainId: String(dstChain),
      srcTokenAddress: srcToken,
      dstTokenAddress: dstToken,
      amount: String(amount),
      walletAddress,
      enableEstimate: "true",
    });

    const quoteRes = await fetch(
      `${FUSION_PLUS_API}/quoter/v2.0/quote/receive?${quoteParams}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!quoteRes.ok) {
      const text = await quoteRes.text();
      console.error("[BRIDGE EXECUTE] quote error:", quoteRes.status, text);
      return NextResponse.json({ error: "Failed to get bridge quote for execution" }, { status: 502 });
    }

    const quoteData = await quoteRes.json();

    const orderRes = await fetch(
      `${FUSION_PLUS_API}/relayer/v2.0/${srcChain}/order/create/v2`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          quoteId: quoteData.quoteId,
          walletAddress,
          source: "azabu-exchange",
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!orderRes.ok) {
      const text = await orderRes.text();
      console.error("[BRIDGE EXECUTE] order error:", orderRes.status, text);
      return NextResponse.json({
        error: "Cross-chain transfers require wallet signature on the client side.",
        quoteData: {
          quoteId: quoteData.quoteId,
          dstTokenAmount: quoteData.dstTokenAmount,
          srcTokenAmount: quoteData.srcTokenAmount,
          recommendedPreset: quoteData.recommendedPreset,
          escrowFactory: quoteData.escrowFactory,
        },
      }, { status: 422 });
    }

    const orderData = await orderRes.json();
    return NextResponse.json({
      orderHash: orderData.orderHash || orderData.hash,
      quoteId: quoteData.quoteId,
      status: "submitted",
    });
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return NextResponse.json({ error: "Bridge service timed out. Please try again." }, { status: 504 });
    }
    console.error("[BRIDGE EXECUTE] error:", err);
    return NextResponse.json({ error: "Bridge execution error" }, { status: 500 });
  }
}
