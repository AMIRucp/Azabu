import { NextRequest, NextResponse } from "next/server";
import { getPrice } from "@server/priceService";

export async function POST(request: NextRequest) {
  try {
    const { tokens } = await request.json();

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json({ error: "tokens array required" }, { status: 400 });
    }

    const uniqueTokens = [...new Set(tokens.map((t: string) => t.toUpperCase().trim()))].slice(0, 20);

    const results: Record<string, { price: number; change24h: number | null }> = {};

    await Promise.allSettled(
      uniqueTokens.map(async (token) => {
        try {
          const priceData = await getPrice(token);
          if (priceData) {
            results[token] = {
              price: priceData.priceUsd,
              change24h: priceData.change24h,
            };
          }
        } catch {}
      })
    );

    const res = NextResponse.json({ prices: results });
    res.headers.set('Cache-Control', 'public, max-age=8, stale-while-revalidate=15');
    return res;
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}
