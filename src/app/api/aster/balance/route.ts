import { NextRequest, NextResponse } from 'next/server';
import { getBalance } from '@server/asterService';
import { resolveAsterCredentials } from '@server/asterCredentials';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const creds = await resolveAsterCredentials(userId);
    if (!creds) {
      return NextResponse.json({ balances: [] });
    }

    const balance = await getBalance(creds);

    return NextResponse.json({ balances: Array.isArray(balance) ? balance : [] });
  } catch (err: unknown) {
    console.error('Aster balance error:', err);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}
