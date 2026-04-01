import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@server/rpc';

export async function POST(request: NextRequest) {
  try {
    const { signedTransaction } = await request.json();
    const connection = getConnection();
    const txBuffer = Buffer.from(signedTransaction, 'base64');

    const signature = await connection.sendRawTransaction(txBuffer, {
      skipPreflight: false,
      maxRetries: 3,
    });

    await connection.confirmTransaction(signature, 'confirmed');

    return NextResponse.json({ signature, status: 'confirmed' });
  } catch (err: unknown) {
    console.error('Submit fee tx error:', err);
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('Access forbidden') || msg.includes('403')) {
      return NextResponse.json({ error: 'RPC access forbidden' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Transaction submission failed' }, { status: 500 });
  }
}
