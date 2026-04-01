import { NextRequest, NextResponse } from "next/server";
import { getMarketChart } from "@server/coingeckoService";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") || "";
  const daysParam = request.nextUrl.searchParams.get("days") || "7";
  const days = Math.min(Math.max(parseInt(daysParam) || 7, 1), 365);

  if (!symbol) {
    return NextResponse.json({ error: "symbol parameter required" }, { status: 400 });
  }

  try {
    const chart = await getMarketChart(symbol, days);
    if (!chart) {
      return NextResponse.json({ error: `No chart data available for ${symbol}` }, { status: 404 });
    }
    return NextResponse.json(chart);
  } catch (err: unknown) {
    console.error("Chart API error:", err);
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 });
  }
}
