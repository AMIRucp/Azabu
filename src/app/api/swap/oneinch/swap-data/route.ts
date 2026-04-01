import { NextRequest, NextResponse } from "next/server";

const ONEINCH_BASE = "https://api.1inch.dev/swap/v6.0";
const ALLOWED_CHAIN_IDS = new Set([1, 42161, 8453]);

const rateLimitMap = new Map<string, { count: number; reset: number }>();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const src = req.nextUrl.searchParams.get("src");
  const dst = req.nextUrl.searchParams.get("dst");
  const amount = req.nextUrl.searchParams.get("amount");
  const from = req.nextUrl.searchParams.get("from");
  const slippage = req.nextUrl.searchParams.get("slippage") || "1";
  const chainIdParam = req.nextUrl.searchParams.get("chainId") || "42161";
  const chainId = parseInt(chainIdParam, 10);

  if (!src || !dst || !amount || !from) {
    return NextResponse.json({ error: "src, dst, amount, and from are required" }, { status: 400 });
  }
  if (!ALLOWED_CHAIN_IDS.has(chainId)) {
    return NextResponse.json({ error: "Unsupported chainId" }, { status: 400 });
  }

  if (!/^0x[0-9a-fA-F]{40}$/.test(src) && src.toLowerCase() !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
    return NextResponse.json({ error: "Invalid src address" }, { status: 400 });
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(dst) && dst.toLowerCase() !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
    return NextResponse.json({ error: "Invalid dst address" }, { status: 400 });
  }
  if (!/^[0-9]+$/.test(amount)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(from)) {
    return NextResponse.json({ error: "Invalid from address" }, { status: 400 });
  }

  const slippageNum = parseFloat(slippage);
  if (isNaN(slippageNum) || slippageNum < 0 || slippageNum > 50) {
    return NextResponse.json({ error: "Invalid slippage" }, { status: 400 });
  }

  const apiKey = process.env.ONEINCH_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Swap service not configured" }, { status: 503 });
  }

  try {
    const params = new URLSearchParams({
      src,
      dst,
      amount,
      from,
      slippage: slippageNum.toString(),
      disableEstimate: "true",
    });

    const res = await fetch(`${ONEINCH_BASE}/${chainId}/swap?${params}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        accept: "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[1INCH SWAP] error:", res.status, text);
      let errMsg = "Swap data failed";
      try {
        const parsed = JSON.parse(text);
        if (parsed.description) errMsg = parsed.description;
        else if (parsed.error) errMsg = parsed.error;
        else if (parsed.message) errMsg = parsed.message;
      } catch {}
      return NextResponse.json({ error: errMsg }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      tx: {
        to: data.tx?.to,
        data: data.tx?.data,
        value: data.tx?.value || "0",
        gas: data.tx?.gas,
      },
      toAmount: data.toAmount,
      fromAmount: data.fromAmount,
    });
  } catch {
    return NextResponse.json({ error: "Swap service error" }, { status: 500 });
  }
}
