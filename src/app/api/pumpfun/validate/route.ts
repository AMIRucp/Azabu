import { NextRequest, NextResponse } from 'next/server';
import { validateLaunchIntent } from '@server/tokenLaunch';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = validateLaunchIntent(body);
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}
