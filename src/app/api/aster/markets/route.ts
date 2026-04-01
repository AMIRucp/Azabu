import { NextRequest, NextResponse } from 'next/server';
import { getMarkPrice } from '@server/asterService';
import { getAsterMarkets, findAsterMarket } from '@server/asterMarketService';

export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action');

    if (action === 'markPrice') {
      const symbol = req.nextUrl.searchParams.get('symbol') || undefined;
      const data = await getMarkPrice(symbol);
      return NextResponse.json(data);
    }

    if (action === 'find') {
      const query = req.nextUrl.searchParams.get('q') || '';
      if (!query) return NextResponse.json({ error: 'Missing q param' }, { status: 400 });
      const market = await findAsterMarket(query);
      if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 });
      return NextResponse.json(market);
    }

    const markets = await getAsterMarkets();

    const crypto = markets.filter(m => m.category === 'crypto');
    const stocks = markets.filter(m => m.category === 'stock');
    const commodities = markets.filter(m => m.category === 'commodity');

    return NextResponse.json({
      all: markets,
      crypto,
      stocks,
      commodities,
      count: markets.length,
      lastUpdated: Date.now(),
    });
  } catch (err: unknown) {
    console.error('Aster markets error:', err);
    return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 });
  }
}
