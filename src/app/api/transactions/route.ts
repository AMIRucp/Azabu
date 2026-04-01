import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@server/storage';
import { api } from '@shared/routes';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = api.transactions.create.input.parse(body);
    const transaction = await storage.createTransaction(input);
    return NextResponse.json(transaction, { status: 201 });
  } catch (err: unknown) {
    console.error('Create transaction error:', err);
    if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid transaction data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
