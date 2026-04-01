import { NextRequest, NextResponse } from 'next/server';
import { getPublicRpcUrl } from '@server/rpc';

export async function GET(req: NextRequest) {
  const rpcUrl = getPublicRpcUrl();
  return NextResponse.json({ rpcUrl });
}
