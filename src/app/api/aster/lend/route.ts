import { NextResponse } from 'next/server';
import { getAsterLendMarkets } from '@server/asterLendService';

export async function GET() {
  try {
    const markets = await getAsterLendMarkets();
    return NextResponse.json({ markets });
  } catch (err: unknown) {
    console.error('Aster lend markets error:', err);
    return NextResponse.json({ error: 'Failed to fetch lend markets' }, { status: 500 });
  }
}
