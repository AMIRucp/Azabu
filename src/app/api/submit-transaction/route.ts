import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@server/rpc';
import { submitTransactionSchema } from '@server/validation';
import { withTradeRateLimit } from '@server/security';

export const POST = withTradeRateLimit(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const parsed = submitTransactionSchema.safeParse({ signedTransaction: body.transaction });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid transaction data' }, { status: 400 });
    }

    const connection = getConnection();
    const txBuffer = Buffer.from(parsed.data.signedTransaction, 'base64');

    const signature = await connection.sendRawTransaction(txBuffer, {
      skipPreflight: false,
      maxRetries: 3,
    });

    await connection.confirmTransaction(signature, 'confirmed');

    return NextResponse.json({ ok: true, signature });
  } catch (err: unknown) {
    console.error('Submit transaction error:', err);
    return NextResponse.json({ error: 'Transaction submission failed' }, { status: 500 });
  }
});
