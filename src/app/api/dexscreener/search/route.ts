import { NextRequest, NextResponse } from 'next/server';
import { searchDexScreener } from '@server/dexscreener';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') || '';
    const pair = await searchDexScreener(q);
    return NextResponse.json({ pair });
  } catch (e: unknown) {
    return NextResponse.json({ pair: null }, { status: 200 });
  }
}
