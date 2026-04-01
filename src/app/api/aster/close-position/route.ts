import { NextRequest, NextResponse } from 'next/server';
import { closePosition } from '@server/asterService';
import { resolveAsterCredentials } from '@server/asterCredentials';
import { logSecurityEvent, withTradeRateLimit } from '@server/security';
import { asterClosePositionSchema } from '@server/validation';

export const POST = withTradeRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = asterClosePositionSchema.safeParse(body);
    if (!parsed.success) {
      logSecurityEvent('INVALID_ASTER_CLOSE', req, { errors: parsed.error.flatten().fieldErrors });
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    const { userId, symbol, side, quantity } = parsed.data;

    const creds = await resolveAsterCredentials(userId);
    if (!creds) {
      return NextResponse.json({ error: 'Aster API keys not configured. Set ASTER_API_KEY and ASTER_API_SECRET in environment.' }, { status: 404 });
    }

    const result = await closePosition(creds, symbol, side, String(quantity));

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Aster close-position error:', message);
    return NextResponse.json({ error: 'Failed to close position' }, { status: 500 });
  }
});
