import { NextRequest, NextResponse } from 'next/server';
import { generateTokenLogo } from '@server/logoGenerator';

export async function POST(req: NextRequest) {
  try {
    const { tokenName, tokenSymbol, description } = await req.json();

    if (!tokenName || !tokenSymbol) {
      return NextResponse.json(
        { error: 'tokenName and tokenSymbol are required' },
        { status: 400 }
      );
    }

    const name = String(tokenName).slice(0, 30);
    const symbol = String(tokenSymbol).slice(0, 10);
    const desc = description ? String(description).slice(0, 280) : undefined;

    const logo = await generateTokenLogo(name, symbol, desc);
    return NextResponse.json({ ok: true, logo });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Logo generation failed' }, { status: 500 });
  }
}
