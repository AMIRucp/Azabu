import { NextRequest, NextResponse } from 'next/server';
import { openPosition } from '@server/asterService';
import { resolveAsterCredentials } from '@server/asterCredentials';
import { storage } from '../../../../../server/storage';
import { logSecurityEvent, withTradeRateLimit } from '@server/security';
import { asterOpenPositionSchema } from '@server/validation';

export const POST = withTradeRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = asterOpenPositionSchema.safeParse(body);
    if (!parsed.success) {
      logSecurityEvent('INVALID_ASTER_OPEN', req, { errors: parsed.error.flatten().fieldErrors });
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const { userId, symbol, side, quantity, leverage, orderType, price, hidden } = parsed.data;
    const resolvedHidden = orderType === 'LIMIT' && hidden === true;

    const creds = await resolveAsterCredentials(userId);
    if (!creds) {
      return NextResponse.json({ error: 'Aster API keys not configured. Set ASTER_API_KEY and ASTER_API_SECRET in environment.' }, { status: 404 });
    }

    const result = await openPosition(
      creds,
      symbol,
      side,
      String(quantity),
      leverage || 1,
      orderType,
      price !== undefined ? String(price) : undefined,
      resolvedHidden
    );

    try {
      const orderId = result?.orderId || result?.clientOrderId || `aster-${Date.now()}`;
      const fillPrice = result?.avgPrice || result?.price || price;
      const fillQty = parseFloat(result?.executedQty || result?.origQty || quantity);
      const priceNum = parseFloat(fillPrice || '0');
      const sizeUsd = fillQty * priceNum;

      if (sizeUsd > 0) {
        await storage.recordTrade({
          wallet: userId,
          protocol: 'aster',
          chain: 'Arbitrum',
          market: symbol.replace(/USDT$/i, ''),
          side: side === 'BUY' ? 'long' : 'short',
          sizeUsd: String(sizeUsd),
          entryPrice: priceNum > 0 ? String(priceNum) : null,
          leverage: leverage ? Number(leverage) : null,
          txSignature: String(orderId),
        });
      }
    } catch (recordErr) {
      console.error('Failed to record Aster trade:', recordErr);
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Aster open-position error:', message);
    const isAsterError = message.startsWith('Aster API') || /too small|stepSize|minQty|margin|insufficient|leverage|symbol/i.test(message);
    return NextResponse.json({ error: isAsterError ? message : 'Failed to open position' }, { status: 500 });
  }
});
