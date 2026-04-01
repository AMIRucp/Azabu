import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Solana swap execution is no longer supported. Use the 1inch EVM swap route.' },
    { status: 410 }
  );
}
