import { NextRequest, NextResponse } from 'next/server';
import { validateBonkLaunchIntent } from '@server/bonkfun';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = validateBonkLaunchIntent(body);

    if (!result.ok) {
      return NextResponse.json(result);
    }

    return NextResponse.json({
      ok: true,
      normalizedIntent: result.normalizedIntent,
      estimatedTotalSol: result.estimatedCostSol,
      warnings: result.warnings,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Estimate failed' }, { status: 500 });
  }
}
