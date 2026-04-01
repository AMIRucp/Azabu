import { NextRequest, NextResponse } from "next/server";

const CMC_BASE = "https://s2.coinmarketcap.com/static/img/coins/64x64";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !/^\d+\.png$/.test(id)) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const res = await fetch(`${CMC_BASE}/${id}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; bot)",
        "Referer": "https://coinmarketcap.com/",
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 86400 },
    });

    if (!res.ok) return new NextResponse(null, { status: 404 });

    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
