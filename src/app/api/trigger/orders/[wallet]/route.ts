import { NextRequest, NextResponse } from 'next/server';
import { getOrders } from '@server/jupiter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }
    const orders = await getOrders(wallet);
    return NextResponse.json(orders);
  } catch (err: unknown) {
    console.error('Get trigger orders error:', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
