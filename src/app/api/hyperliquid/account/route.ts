import { NextRequest, NextResponse } from 'next/server';
import { fetchAccountState, fetchOpenOrders } from '@/services/hyperliquid/hlAccount';

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address) {
    return NextResponse.json({ error: 'address required' }, { status: 400 });
  }

  try {
    const [state, orders] = await Promise.all([
      fetchAccountState(address),
      fetchOpenOrders(address),
    ]);

    const positions = state.assetPositions
      .filter((p) => parseFloat(p.position.szi) !== 0)
      .map((p) => ({
        coin: p.position.coin,
        size: p.position.szi,
        entryPrice: p.position.entryPx,
        positionValue: p.position.positionValue,
        unrealizedPnl: p.position.unrealizedPnl,
        returnOnEquity: p.position.returnOnEquity,
        leverage: p.position.leverage,
        liquidationPrice: p.position.liquidationPx,
        marginUsed: p.position.marginUsed,
        maxLeverage: p.position.maxLeverage,
        marginType: p.type,
      }));

    return NextResponse.json({
      balance: state.marginSummary,
      crossBalance: state.crossMarginSummary,
      positions,
      openOrders: orders,
    });
  } catch (e: any) {
    console.error('[HL Account]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
