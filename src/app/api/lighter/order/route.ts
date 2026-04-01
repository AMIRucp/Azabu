import { NextRequest, NextResponse } from 'next/server';
import { getLighterCredentials, submitLighterOrder, cancelLighterOrder } from '@server/lighterService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { marketTicker, side, size, orderType, price, action, orderId } = body;

    const creds = getLighterCredentials();
    if (!creds) {
      return NextResponse.json(
        { error: 'Lighter credentials not configured. Set LIGHTER_ETH_PUBLIC_KEY, LIGHTER_ETH_PRIVATE, and LIGHTER_WALLET_ADDRESS.' },
        { status: 503 }
      );
    }

    if (action === 'cancel' && orderId) {
      const result = await cancelLighterOrder(creds, orderId, marketTicker);
      return NextResponse.json({ ok: true, result });
    }

    if (!marketTicker || !side || !size) {
      return NextResponse.json({ error: 'Missing required fields: marketTicker, side, size' }, { status: 400 });
    }

    if (!['buy', 'sell'].includes(side)) {
      return NextResponse.json({ error: 'side must be buy or sell' }, { status: 400 });
    }

    const result = await submitLighterOrder(
      creds,
      marketTicker,
      side as 'buy' | 'sell',
      String(size),
      orderType === 'limit' ? 'limit' : 'market',
      price ? String(price) : undefined
    );

    return NextResponse.json({ ok: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[Lighter] Order error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
