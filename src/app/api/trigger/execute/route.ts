import { NextRequest, NextResponse } from 'next/server';
import { executeTriggerOrder } from '@server/jupiter';

export async function POST(request: NextRequest) {
  try {
    const { signedTransaction, requestId } = await request.json();
    const result = await executeTriggerOrder(signedTransaction, requestId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('Trigger execute error:', err);
    return NextResponse.json({ error: 'Trigger order execution failed' }, { status: 500 });
  }
}
