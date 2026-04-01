import { NextResponse } from 'next/server';
import { fetchHyperliquidMarkets } from '@/services/hyperliquid/hlMarkets';

export async function GET() {
  try {
    const data = await fetchHyperliquidMarkets();
    const markets = data.meta.universe
      .map((asset, i) => {
        if (asset.isDelisted) return null;
        const ctx = data.assetCtxs[i];
        if (!ctx) return null;

        const midPx = ctx.midPx ? parseFloat(ctx.midPx) : parseFloat(ctx.markPx);
        const prevDayPx = parseFloat(ctx.prevDayPx);
        const change24h = prevDayPx > 0 ? ((midPx - prevDayPx) / prevDayPx) * 100 : 0;

        return {
          coin: asset.name,
          assetIndex: i,
          price: midPx,
          markPrice: parseFloat(ctx.markPx),
          indexPrice: parseFloat(ctx.oraclePx),
          change24h,
          volume24h: parseFloat(ctx.dayNtlVlm),
          openInterest: parseFloat(ctx.openInterest),
          fundingRate: parseFloat(ctx.funding) * 100,
          maxLeverage: asset.maxLeverage,
          szDecimals: asset.szDecimals,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ markets });
  } catch (e: any) {
    console.error('[HL Markets]', e.message);
    return NextResponse.json({ markets: [] }, { status: 500 });
  }
}
