import { NextRequest, NextResponse } from 'next/server';
import { setTakeProfit, setStopLoss } from '@server/asterService';
import { resolveAsterCredentials } from '@server/asterCredentials';
import { asterTpSlSchema } from '@server/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = asterTpSlSchema.safeParse({
      userId: body.userId,
      symbol: body.symbol,
      side: body.side,
      quantity: typeof body.quantity === 'number' ? body.quantity : parseFloat(body.quantity),
      takeProfitPrice: body.takeProfit ? Number(body.takeProfit) : undefined,
      stopLossPrice: body.stopLoss ? Number(body.stopLoss) : undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'userId, symbol, side, quantity required with takeProfit and/or stopLoss' }, { status: 400 });
    }

    const { userId, symbol, side, quantity, takeProfitPrice, stopLossPrice } = parsed.data;

    if (!takeProfitPrice && !stopLossPrice) {
      return NextResponse.json({ error: 'At least one of takeProfit or stopLoss required' }, { status: 400 });
    }

    const creds = await resolveAsterCredentials(userId);
    if (!creds) {
      return NextResponse.json({ error: 'Aster API keys not configured.' }, { status: 404 });
    }

    const results: Record<string, unknown> = {};

    if (takeProfitPrice) {
      results.takeProfit = await setTakeProfit(creds, symbol, side, String(takeProfitPrice), String(quantity));
    }

    if (stopLossPrice) {
      results.stopLoss = await setStopLoss(creds, symbol, side, String(stopLossPrice), String(quantity));
    }

    return NextResponse.json(results);
  } catch (err: unknown) {
    console.error('Aster tp-sl error:', err);
    return NextResponse.json({ error: 'Failed to set TP/SL' }, { status: 500 });
  }
}
