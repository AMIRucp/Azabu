import { NextRequest, NextResponse } from 'next/server';
import { getOrderBook } from '@server/asterService';

export async function GET(req: NextRequest) {
  try {
    const symbol = req.nextUrl.searchParams.get('symbol');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10);

    if (!symbol) {
      return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 });
    }

    const data = await getOrderBook(symbol.toUpperCase(), Math.min(limit, 100));

    const bids = (data.bids || []).map((b: string[]) => ({
      price: parseFloat(b[0]),
      size: parseFloat(b[1]),
    }));

    const asks = (data.asks || []).map((a: string[]) => ({
      price: parseFloat(a[0]),
      size: parseFloat(a[1]),
    }));

    return NextResponse.json({ bids, asks });
  } catch (err: unknown) {
    console.error('Aster orderbook error:', err);
    return NextResponse.json({ error: 'Failed to fetch order book' }, { status: 500 });
  }
}
