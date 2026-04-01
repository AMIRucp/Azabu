import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@server/storage';
import { validateWalletAddress } from '@server/security';

export async function GET(req: NextRequest, { params }: { params: Promise<{ walletAddress: string }> }) {
  const { walletAddress } = await params;

  if (!walletAddress || walletAddress.length > 50) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  const { valid } = validateWalletAddress(walletAddress);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 });
  }

  const user = await storage.getUser(walletAddress);
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  return NextResponse.json(user);
}
