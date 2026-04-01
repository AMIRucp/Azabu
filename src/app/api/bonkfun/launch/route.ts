import { NextRequest, NextResponse } from 'next/server';
import { prepareBonkLaunchTransaction } from '@server/bonkfun';
import type { BonkLaunchIntent } from '@server/bonkfun';
import { withTradeRateLimit } from '@server/security';

export const POST = withTradeRateLimit(async (req: NextRequest) => {
  try {
    const formData = await req.formData();

    const name = formData.get('name') as string;
    const symbol = formData.get('symbol') as string;
    const description = (formData.get('description') as string) || '';
    const creatorPublicKey = formData.get('creatorPublicKey') as string;
    const initialBuySol = formData.get('initialBuySol') ? parseFloat(formData.get('initialBuySol') as string) : undefined;
    const slippagePercent = formData.get('slippagePercent') ? parseFloat(formData.get('slippagePercent') as string) : undefined;
    const priorityFeeSol = formData.get('priorityFeeSol') ? parseFloat(formData.get('priorityFeeSol') as string) : undefined;
    const twitter = (formData.get('twitter') as string) || undefined;
    const telegram = (formData.get('telegram') as string) || undefined;
    const website = (formData.get('website') as string) || undefined;
    const imageUrl = (formData.get('imageUrl') as string) || undefined;

    let imageBuffer: Buffer | undefined;
    let imageName: string | undefined;

    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      imageName = imageFile.name;
    }

    const intent: BonkLaunchIntent = {
      name,
      symbol,
      description,
      creatorPublicKey,
      initialBuySol,
      slippagePercent,
      priorityFeeSol,
      twitter,
      telegram,
      website,
      imageUrl,
    };

    const result = await prepareBonkLaunchTransaction(intent, imageBuffer, imageName);
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: 'Launch failed' }, { status: 500 });
  }
});
