import { NextRequest, NextResponse } from 'next/server';
import { getAaveMarkets } from '../../../../../server/aaveService';

export async function GET(req: NextRequest) {
  try {
    const chain = req.nextUrl.searchParams.get('chain') || undefined;
    const markets = await getAaveMarkets(chain);
    return NextResponse.json({ markets });
  } catch (e: unknown) {
    return NextResponse.json(
      { markets: [], error: 'Service unavailable' },
      { status: 500 }
    );
  }
}
