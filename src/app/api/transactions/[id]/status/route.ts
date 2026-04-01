import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@server/storage';
import { api } from '@shared/routes';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const input = api.transactions.updateStatus.input.parse(body);
    const result = await storage.updateTransactionStatus(Number(id), input.status, input.signature);

    if (!result) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('Update transaction status error:', err);
    if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update transaction status' }, { status: 500 });
  }
}
