import { NextRequest, NextResponse } from 'next/server';
import { validateBonkLaunchIntent } from '@server/bonkfun';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = validateBonkLaunchIntent(body);
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}
