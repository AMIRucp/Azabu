import { NextRequest, NextResponse } from 'next/server';
import { fetchLighterMarketData } from '@server/lighterService';

export async function GET(_req: NextRequest) {
  try {
    const data = await fetchLighterMarketData();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch Lighter markets';
    console.error('[Lighter] Markets fetch error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
