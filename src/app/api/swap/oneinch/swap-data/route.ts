import { NextRequest, NextResponse } from "next/server";

const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const src = searchParams.get("src");
  const dst = searchParams.get("dst");
  const amount = searchParams.get("amount");
  const from = searchParams.get("from");
  const slippage = searchParams.get("slippage");
  const chainId = searchParams.get("chainId");

  if (!src || !dst || !amount || !from || !slippage || !chainId) {
    return NextResponse.json(
      { error: "Missing required parameters: src, dst, amount, from, slippage, chainId" },
      { status: 400 }
    );
  }

  if (!ONEINCH_API_KEY) {
    return NextResponse.json(
      { error: "1inch API key not configured" },
      { status: 500 }
    );
  }

  try {
    const params = new URLSearchParams({
      src,
      dst,
      amount,
      from,
      slippage,
      disableEstimate: "true",
      allowPartialFill: "false",
    });

    const url = `https://api.1inch.com/swap/v6.0/${chainId}/swap?${params}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${ONEINCH_API_KEY}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `1inch API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch swap data" },
      { status: 500 }
    );
  }
}