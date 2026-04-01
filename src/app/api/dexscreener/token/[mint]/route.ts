import { NextRequest, NextResponse } from 'next/server';
import { fetchDexScreenerToken } from '@server/dexscreener';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mint: string }> }
) {
  try {
    const { mint } = await params;
    const pair = await fetchDexScreenerToken(mint);
    return NextResponse.json({ pair });
  } catch (e: unknown) {
    return NextResponse.json({ pair: null }, { status: 200 });
  }
}
