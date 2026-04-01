import { NextRequest, NextResponse } from "next/server";

const FUSION_PLUS_API = "https://api.1inch.dev/fusion-plus";

export async function GET(req: NextRequest) {
  const orderHash = req.nextUrl.searchParams.get("hash");
  const srcChain = req.nextUrl.searchParams.get("srcChain");

  if (!orderHash || !srcChain) {
    return NextResponse.json({ error: "hash and srcChain required" }, { status: 400 });
  }

  const apiKey = process.env.ONEINCH_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Bridge service not configured" }, { status: 503 });
  }

  try {
    const res = await fetch(
      `${FUSION_PLUS_API}/relayer/v2.0/${srcChain}/order/status/${orderHash}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("[BRIDGE STATUS]", res.status, text);
      return NextResponse.json({ error: "Status check failed" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[BRIDGE STATUS] error:", err);
    return NextResponse.json({ error: "Status service error" }, { status: 500 });
  }
}
