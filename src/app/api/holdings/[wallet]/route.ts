import { NextRequest, NextResponse } from 'next/server';
import { getEnrichedHoldings } from '@server/holdings';

export async function GET(req: NextRequest, { params }: { params: Promise<{ wallet: string }> }) {
  try {
    const { wallet } = await params;
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
      return NextResponse.json({ ok: false, message: 'Invalid wallet address' }, { status: 400 });
    }
    const data = await getEnrichedHoldings(wallet);
    return NextResponse.json({ ok: true, ...data });
  } catch (err: unknown) {
    console.error('Holdings fetch error:', err);
    return NextResponse.json({ ok: false, message: 'Failed to fetch holdings' }, { status: 500 });
  }
}
