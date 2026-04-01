import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../server/db';
import { userProfiles } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createProfileSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-z0-9_]+$/),
  avatarId: z.string().min(1),
  email: z.string().email().optional(),
  walletAddress: z.string().optional(),
  telegramId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid profile data' }, { status: 400 });
    }

    const existing = await db.select().from(userProfiles)
      .where(eq(userProfiles.username, parsed.data.username)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'That username is taken' }, { status: 409 });
    }

    const [profile] = await db.insert(userProfiles).values({
      username: parsed.data.username,
      avatarId: parsed.data.avatarId,
      email: parsed.data.email || null,
      walletAddress: parsed.data.walletAddress || null,
      telegramId: parsed.data.telegramId || null,
    }).returning();

    return NextResponse.json({ success: true, profile });
  } catch (err: unknown) {
    console.error('Profile creation error:', err);
    if (err && typeof err === 'object' && 'code' in err && (err as Record<string, unknown>).code === '23505') {
      return NextResponse.json({ error: 'That username is taken' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const walletAddress = searchParams.get('wallet');

    if (username) {
      const [profile] = await db.select().from(userProfiles)
        .where(eq(userProfiles.username, username)).limit(1);
      if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const { email: _e, ...safeProfile } = profile;
      return NextResponse.json({ profile: safeProfile });
    }

    if (walletAddress) {
      const [profile] = await db.select().from(userProfiles)
        .where(eq(userProfiles.walletAddress, walletAddress)).limit(1);
      if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const { email: _e, ...safeProfile } = profile;
      return NextResponse.json({ profile: safeProfile });
    }

    return NextResponse.json({ error: 'Provide username or wallet query param' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Profile fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
