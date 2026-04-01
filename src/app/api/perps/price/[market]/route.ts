import { NextRequest, NextResponse } from 'next/server';
import { driftGetPrice } from '@server/drift';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ market: string }> }
) {
  try {
    const { market } = await params;
    const price = await driftGetPrice(market);
    return NextResponse.json({ price }, {
      headers: { 'Cache-Control': 'public, max-age=5, s-maxage=5, stale-while-revalidate=10' },
    });
  } catch (e: unknown) {
    return NextResponse.json({ price: null }, { status: 200 });
  }
}
