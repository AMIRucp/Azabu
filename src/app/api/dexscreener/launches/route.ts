import { NextRequest, NextResponse } from 'next/server';
import { fetchNewLaunches, enrichLaunchesWithPairData } from '@server/dexscreener';

export async function GET(req: NextRequest) {
  try {
    const launches = await fetchNewLaunches();
    if (!launches || launches.length === 0) {
      return NextResponse.json({ launches: [] });
    }

    const enriched = await enrichLaunchesWithPairData(launches);

    const tokens = enriched.map((l) => ({
      symbol: l.pair?.baseToken?.symbol || l.tokenAddress.slice(0, 6),
      name: l.pair?.baseToken?.name || l.name || l.tokenAddress.slice(0, 10),
      chainId: "solana",
      address: l.tokenAddress,
      url: l.url,
      icon: l.icon,
      volumeH24: l.pair?.volume?.h24 ?? 0,
      priceUsd: l.pair?.priceUsd != null ? String(l.pair.priceUsd) : null,
      liquidity: l.pair?.liquidity?.usd ?? 0,
      priceChange: l.pair?.priceChange?.h24 ?? 0,
      createdAt: l.pair?.pairCreatedAt ?? null,
    }));

    return NextResponse.json({ launches: tokens }, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (e: unknown) {
    return NextResponse.json({ launches: [] }, { status: 200 });
  }
}
