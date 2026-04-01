import { NextRequest, NextResponse } from 'next/server';

const JUP_LEND_API = 'https://api.jup.ag/lend/v1';
const API_KEY = process.env.JUPITER_API_KEY || '';

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${JUP_LEND_API}/earn/tokens`, {
      headers: API_KEY ? { 'x-api-key': API_KEY } : {},
    });
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Failed to fetch lend tokens' }, { status: 502 });
  }
}
