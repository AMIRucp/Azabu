import { NextRequest, NextResponse } from "next/server";

const ONEINCH_BASE = "https://api.1inch.dev/swap/v6.0/42161";
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const AMOUNT_RE = /^[0-9]+$/;

function headers() {
  return {
    "Authorization": `Bearer ${process.env.ONEINCH_API_KEY}`,
    "Accept": "application/json",
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const src = searchParams.get("src");
  const dst = searchParams.get("dst");
  const amount = searchParams.get("amount");

  if (!src || !dst || !amount) {
    return NextResponse.json({ error: "Missing src, dst, or amount" }, { status: 400 });
  }
  if (!ADDRESS_RE.test(src) || !ADDRESS_RE.test(dst)) {
    return NextResponse.json({ error: "Invalid token address" }, { status: 400 });
  }
  if (!AMOUNT_RE.test(amount)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({ src, dst, amount });
    const res = await fetch(`${ONEINCH_BASE}/quote?${params}`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.description || "Quote failed" }, { status: res.status });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { src, dst, amount, from, slippage = 1 } = body;

  if (!src || !dst || !amount || !from) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!ADDRESS_RE.test(src) || !ADDRESS_RE.test(dst) || !ADDRESS_RE.test(from)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }
  if (!AMOUNT_RE.test(String(amount))) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      src, dst, amount: String(amount), from,
      slippage: String(slippage),
      disableEstimate: "true",
    });
    const res = await fetch(`${ONEINCH_BASE}/swap?${params}`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.description || "Swap data failed" }, { status: res.status });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
