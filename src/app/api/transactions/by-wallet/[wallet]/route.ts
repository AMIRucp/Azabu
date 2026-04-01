import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@server/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    const transactions = await storage.getTransactions(wallet);
    return NextResponse.json(transactions);
  } catch (err: unknown) {
    console.error('Get transactions error:', err);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
