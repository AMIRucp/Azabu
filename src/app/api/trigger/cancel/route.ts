import { NextRequest, NextResponse } from 'next/server';
import { cancelOrder } from '@server/jupiter';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, orderAccount } = await request.json();

    if (!walletAddress || !orderAccount) {
      return NextResponse.json({ error: 'Missing required fields: walletAddress, orderAccount' }, { status: 400 });
    }

    const result = await cancelOrder(walletAddress, orderAccount);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    console.error('Trigger cancel error:', err);
    return NextResponse.json({ error: 'Order cancellation failed' }, { status: 500 });
  }
}
