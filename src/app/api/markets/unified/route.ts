import { NextRequest, NextResponse } from 'next/server';
import { refreshAllMarkets } from '@/services/marketLoader';

let cache: unknown[] = [];
let cacheTs = 0;
const CACHE_TTL = 45_000;

let inFlight: Promise<unknown[]> | null = null;

export async function GET(req: NextRequest) {
  try {
    const now = Date.now();
    if (now - cacheTs > CACHE_TTL || cache.length === 0) {
      if (!inFlight) {
        const proto = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host') || 'localhost:5000';
        const origin = `${proto}://${host}`;
        inFlight = refreshAllMarkets(origin).finally(() => { inFlight = null; });
      }
      cache = await inFlight;
      cacheTs = Date.now();
    }
    const res = NextResponse.json({ markets: cache, ts: cacheTs });
    res.headers.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
    return res;
  } catch (err: unknown) {
    return NextResponse.json(
      { markets: cache, error: 'Failed to refresh markets' },
      { status: 500 }
    );
  }
}
