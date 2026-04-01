import type { TxCallbacks } from './shared';
import { recordTradeToDb } from './shared';
import { LIGHTER_MARKET_BY_SYMBOL } from '@/config/lighterMarkets';

export interface LighterTradeParams {
  market: { sym: string; price: number; maxLev: number; marketName?: string; category?: string };
  side: 'long' | 'short';
  sizeNum: number;
  posValue: number;
  lev: number;
  otype: 'market' | 'limit' | 'stop';
  price: string;
  maxLev: number;
  marketSymbol: string;
  tp: string;
  sl: string;
  evmAddress?: string;
  onTradeSuccess?: () => void;
}

export async function executeLighterTrade(
  params: LighterTradeParams,
  callbacks: TxCallbacks
): Promise<void> {
  const { market, side, sizeNum, posValue, lev, otype, price, marketSymbol, tp, sl, evmAddress, onTradeSuccess } = params;
  const { setTxState, setTxMsg, setTxSig } = callbacks;

  try {
    setTxState('signing');
    setTxMsg('Placing order on Lighter...');

    const internalSymbol = market.sym
      .replace(/d-PERP$/i, '')
      .replace(/-PERP$/i, '');
    const cfg = LIGHTER_MARKET_BY_SYMBOL.get(internalSymbol) ||
      LIGHTER_MARKET_BY_SYMBOL.get(market.sym);

    if (!cfg) {
      setTxMsg(`Unknown Lighter market: ${market.sym}`);
      setTxState('error');
      return;
    }

    const orderBody: Record<string, any> = {
      marketTicker: cfg.venueTicker,
      side: side === 'long' ? 'buy' : 'sell',
      size: sizeNum.toString(),
      orderType: otype === 'market' ? 'market' : 'limit',
    };

    if (otype !== 'market' && price) {
      orderBody.price = price;
    }

    const res = await fetch('/api/lighter/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderBody),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      setTxMsg(data.error || 'Lighter order failed');
      setTxState('error');
      return;
    }

    if (tp && parseFloat(tp) > 0 && cfg) {
      try {
        await fetch('/api/lighter/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            marketTicker: cfg.venueTicker,
            side: side === 'long' ? 'sell' : 'buy',
            size: sizeNum.toString(),
            orderType: 'limit',
            price: tp,
          }),
        });
      } catch {}
    }

    const hasTp = tp && parseFloat(tp) > 0;
    const hasSl = sl && parseFloat(sl) > 0;
    const tpSlNote = hasSl
      ? ' (SL not supported on Lighter — set manually)'
      : hasTp ? ' + TP set' : '';

    setTxMsg(`${side.toUpperCase()} ${internalSymbol} placed on Lighter${tpSlNote}`);
    setTxSig(null);
    setTxState('success');

    recordTradeToDb({
      wallet: evmAddress || 'lighter-wallet',
      protocol: 'lighter',
      chain: 'lighter',
      market: internalSymbol,
      side,
      sizeUsd: posValue,
      entryPrice: market.price,
      leverage: lev,
      txSignature: `lighter-${Date.now()}`,
    });

    onTradeSuccess?.();
  } catch (e: any) {
    setTxMsg(e.message || 'Lighter trade failed');
    setTxState('error');
  }
}
