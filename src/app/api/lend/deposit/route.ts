import { NextRequest, NextResponse } from 'next/server';
import { withTradeRateLimit } from '@server/security';

const JUP_LEND_API = 'https://api.jup.ag/lend/v1';
const API_KEY = process.env.JUPITER_PREDICTION_API_KEY || process.env.JUPITER_API_KEY || '';

const MINT_MAP: Record<string, string> = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  SOL: 'So11111111111111111111111111111111111111112',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
};

const DECIMALS: Record<string, number> = { USDC: 6, SOL: 9, USDT: 6 };

export const POST = withTradeRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const symbol = (body.asset || body.token || 'USDC').toUpperCase();
    const signer = body.signer || body.owner;
    const uiAmount = parseFloat(body.amount);
    if (!signer || !uiAmount || uiAmount <= 0) {
      return NextResponse.json({ error: 'Missing required fields: asset, amount, signer' }, { status: 400 });
    }
    const mint = MINT_MAP[symbol];
    if (!mint) {
      return NextResponse.json({ error: `Unsupported asset: ${symbol}` }, { status: 400 });
    }
    const decimals = DECIMALS[symbol] || 6;
    const rawAmount = Math.round(uiAmount * 10 ** decimals).toString();

    const res = await fetch(`${JUP_LEND_API}/earn/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
      },
      body: JSON.stringify({ asset: mint, amount: rawAmount, signer }),
    });
    const raw = await res.text();
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch {
      return NextResponse.json({ error: `Jupiter API error: ${raw.slice(0, 200)}` }, { status: 502 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: parsed.message || parsed.error || 'Jupiter deposit failed' }, { status: res.status });
    }
    if (!parsed.transaction) {
      return NextResponse.json({ error: 'No transaction returned from Jupiter' }, { status: 502 });
    }
    return NextResponse.json(parsed);
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Failed to deposit' }, { status: 502 });
  }
});
