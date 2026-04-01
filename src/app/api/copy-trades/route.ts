import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@server/storage';
import { getRecentSwaps, checkCopyTrades } from '@server/copyTradeService';

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');
  const action = req.nextUrl.searchParams.get('action');

  if (!wallet) {
    return NextResponse.json({ error: 'wallet required' }, { status: 400 });
  }

  if (action === 'check') {
    try {
      const results = await checkCopyTrades(wallet);
      return NextResponse.json({ results });
    } catch (err: unknown) {
      console.error('Copy trade check error:', err);
      return NextResponse.json({ error: 'Failed to check copy trades' }, { status: 500 });
    }
  }

  try {
    const trades = await storage.getCopyTrades(wallet);
    return NextResponse.json({ trades: trades.filter(t => t.active) });
  } catch (err: unknown) {
    console.error('Copy trades fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch copy trades' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, targetWallet, scale = 1.0 } = body;

    if (!walletAddress || !targetWallet) {
      return NextResponse.json({ error: 'walletAddress and targetWallet required' }, { status: 400 });
    }

    const ct = await storage.createCopyTrade({
      walletAddress,
      targetWallet,
      scale: String(scale),
      active: true,
    });

    return NextResponse.json({ copyTrade: ct });
  } catch (err: unknown) {
    console.error('Copy trade create error:', err);
    return NextResponse.json({ error: 'Failed to create copy trade' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');
  const target = req.nextUrl.searchParams.get('target');

  if (!wallet) {
    return NextResponse.json({ error: 'wallet required' }, { status: 400 });
  }

  try {
    if (target) {
      const deactivated = await storage.deactivateCopyTrade(wallet, target);
      return NextResponse.json({ deactivated: !!deactivated });
    } else {
      const count = await storage.deactivateAllCopyTrades(wallet);
      return NextResponse.json({ deactivated: count });
    }
  } catch (err: unknown) {
    console.error('Copy trade delete error:', err);
    return NextResponse.json({ error: 'Failed to deactivate copy trade' }, { status: 500 });
  }
}
