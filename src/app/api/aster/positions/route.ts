import { NextRequest, NextResponse } from 'next/server';
import { getPositions } from '@server/asterService';
import { resolveAsterCredentials } from '@server/asterCredentials';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const creds = await resolveAsterCredentials(userId);
    if (!creds) {
      return NextResponse.json({ positions: [] });
    }

    const positions = await getPositions(creds);

    return NextResponse.json({ positions: Array.isArray(positions) ? positions : [] });
  } catch (err: unknown) {
    console.error('Aster positions error:', err);
    return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
  }
}
