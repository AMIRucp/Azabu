import { NextRequest, NextResponse } from 'next/server';
import { placeOrder, cancelOrder, updateLeverage, setPositionTpSl } from '@/services/hyperliquid/hlTrading';
import { getAgentKey } from '@/services/hyperliquid/hlAgent';
import { getAssetIndex, fetchHyperliquidMarkets } from '@/services/hyperliquid/hlMarkets';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userAddress, coin, ...params } = body;

    const agentKey = getAgentKey(userAddress);
    if (!agentKey) {
      return NextResponse.json(
        { error: 'No agent wallet approved. Please enable Hyperliquid trading first.' },
        { status: 403 },
      );
    }

    const markets = await fetchHyperliquidMarkets();
    const assetIdx = getAssetIndex(markets.meta, coin);
    if (assetIdx < 0) {
      return NextResponse.json({ error: `Unknown coin: ${coin}` }, { status: 400 });
    }

    if (action === 'place') {
      const result = await placeOrder(agentKey as `0x${string}`, assetIdx, {
        coin,
        isBuy: params.isBuy,
        size: params.size,
        price: params.price,
        orderType: params.orderType || 'market',
        reduceOnly: params.reduceOnly,
        tpsl: params.tpsl,
      });
      return NextResponse.json({ ok: true, result });
    }

    if (action === 'cancel') {
      const result = await cancelOrder(agentKey as `0x${string}`, assetIdx, params.orderId);
      return NextResponse.json({ ok: true, result });
    }

    if (action === 'tpsl') {
      const result = await setPositionTpSl(
        agentKey as `0x${string}`,
        assetIdx,
        params.isBuy,
        params.size,
        params.triggerPx,
        params.tpslType,
      );
      return NextResponse.json({ ok: true, result });
    }

    if (action === 'leverage') {
      const reqLev = Number(params.leverage);
      if (!Number.isFinite(reqLev) || reqLev < 1) {
        return NextResponse.json({ error: 'Invalid leverage value' }, { status: 400 });
      }
      const marketMaxLev = markets.meta.universe[assetIdx]?.maxLeverage || 3;
      const clampedLev = Math.min(Math.max(1, Math.round(reqLev)), marketMaxLev);
      const result = await updateLeverage(
        agentKey as `0x${string}`,
        assetIdx,
        clampedLev,
        params.isCross ?? true,
      );
      return NextResponse.json({ ok: true, result, leverage: clampedLev, maxLeverage: marketMaxLev });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    console.error('[HL Order]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
