import { NextRequest, NextResponse } from "next/server";

const ASTER_BASE = "https://fapi.asterdex.com";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get("symbol");
  const interval = searchParams.get("interval") || "1h";
  const limit = searchParams.get("limit") || "500";
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  const params = new URLSearchParams({ symbol, interval, limit });
  if (startTime) params.set("startTime", startTime);
  if (endTime) params.set("endTime", endTime);

  try {
    const res = await fetch(`${ASTER_BASE}/fapi/v3/klines?${params}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch klines from Aster" }, { status: res.status });
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=10",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch Aster klines" }, { status: 500 });
  }
}
