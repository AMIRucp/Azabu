import { NextRequest, NextResponse } from 'next/server';
import { driftGetPositions } from '@server/drift';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
      return NextResponse.json({ positions: [] }, { status: 400 });
    }
    const positions = await driftGetPositions(wallet);
    return NextResponse.json({ positions });
  } catch (e: unknown) {
    return NextResponse.json({ positions: [] }, { status: 200 });
  }
}
