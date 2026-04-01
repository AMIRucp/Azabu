import { NextRequest, NextResponse } from 'next/server';
import { executeDCA } from '@server/dcaService';

export async function POST(request: NextRequest) {
  try {
    const { signedTransaction, requestId } = await request.json();
    const result = await executeDCA(signedTransaction, requestId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('DCA execute error:', err);
    return NextResponse.json({ error: 'DCA execution failed' }, { status: 500 });
  }
}
