import { NextRequest, NextResponse } from 'next/server';
import { getKlines } from '@server/asterService';

export async function GET(req: NextRequest) {
  try {
    const symbol = req.nextUrl.searchParams.get('symbol');
    const interval = req.nextUrl.searchParams.get('interval') || '1h';
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '500', 10);

    if (!symbol) {
      return NextResponse.json({ error: 'symbol required' }, { status: 400 });
    }

    const data = await getKlines(symbol, interval, limit);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Aster klines error:', err);
    return NextResponse.json({ error: 'Failed to fetch klines' }, { status: 500 });
  }
}
