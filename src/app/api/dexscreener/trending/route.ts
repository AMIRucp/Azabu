import { NextRequest, NextResponse } from 'next/server';

const DEX_BASE = "https://api.dexscreener.com";
const ICON_CDN = "https://dd.dexscreener.com/ds-data/tokens/solana";

export async function GET(req: NextRequest) {
  try {
    const response = await fetch(`${DEX_BASE}/token-boosts/top/v1`, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      return NextResponse.json({ tokens: [] }, { status: response.status });
    }

    const data = await response.json();
    const raw = Array.isArray(data) ? data : (data.data || []);

    const solanaTokens = raw
      .filter((t: any) => {
        const chain = (t.chainId || t.chain || "").toLowerCase();
        if (chain === "solana") return true;
        if (!chain && t.tokenAddress && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(t.tokenAddress)) return true;
        return false;
      })
      .slice(0, 10);

    if (solanaTokens.length === 0) {
      return NextResponse.json({ tokens: [] });
    }

    const addresses = solanaTokens.map((t: any) => t.tokenAddress).filter(Boolean);
    let enriched: Record<string, any> = {};

    try {
      const batch = addresses.slice(0, 10).join(",");
      const lookupRes = await fetch(`${DEX_BASE}/tokens/v1/solana/${batch}`, {
        headers: { "Accept": "application/json" },
      });
      if (lookupRes.ok) {
        const pairs = await lookupRes.json();
        const pairArr = Array.isArray(pairs) ? pairs : (pairs.pairs || []);
        for (const p of pairArr) {
          const addr = p.baseToken?.address;
          if (addr && !enriched[addr]) {
            enriched[addr] = {
              symbol: p.baseToken?.symbol || "",
              name: p.baseToken?.name || "",
              priceUsd: p.priceUsd || null,
              volumeH24: p.volume?.h24 || 0,
              liquidity: p.liquidity?.usd || 0,
              priceChange: p.priceChange?.h24 || 0,
              icon: p.info?.imageUrl || `${ICON_CDN}/${addr}.png`,
              pairCreatedAt: p.pairCreatedAt || null,
            };
          }
        }
      }
    } catch {}

    const tokens = solanaTokens.map((t: any) => {
      const addr = t.tokenAddress || "";
      const e = enriched[addr] || {};
      return {
        symbol: e.symbol || addr.slice(0, 8),
        name: e.name || addr.slice(0, 12),
        chainId: "solana",
        address: addr,
        url: t.url || `https://dexscreener.com/solana/${addr}`,
        icon: e.icon || (t.icon ? `${ICON_CDN}/${addr}.png` : null),
        volumeH24: e.volumeH24 || 0,
        priceUsd: e.priceUsd || null,
        liquidity: e.liquidity || 0,
        priceChange: e.priceChange || 0,
        totalAmount: t.totalAmount || 0,
        createdAt: e.pairCreatedAt || null,
      };
    });

    return NextResponse.json({ tokens }, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err: unknown) {
    console.error('Trending tokens error:', err);
    return NextResponse.json({ error: 'Failed to fetch trending tokens', tokens: [] }, { status: 500 });
  }
}
