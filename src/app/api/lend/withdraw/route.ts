import { NextRequest, NextResponse } from 'next/server';
import { withTradeRateLimit } from '@server/security';

const JUP_LEND_API = 'https://api.jup.ag/lend/v1';
const API_KEY = process.env.JUPITER_API_KEY || '';

export const POST = withTradeRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const asset = body.asset || body.token;
    const signer = body.signer || body.owner;
    const amount = body.amount;
    if (!signer || !amount || !asset) {
      return NextResponse.json({ error: 'Missing required fields: asset, amount, signer' }, { status: 400 });
    }
    const res = await fetch(`${JUP_LEND_API}/earn/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
      },
      body: JSON.stringify({ asset, amount: amount.toString(), signer }),
    });
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Failed to withdraw' }, { status: 502 });
  }
});
