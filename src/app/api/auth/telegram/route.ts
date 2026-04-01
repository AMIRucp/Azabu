import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '../../../../../server/db';
import { telegramUsers } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const telegramAuthSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(v => Number(v)),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.union([z.string(), z.number()]).transform(v => Number(v)),
  hash: z.string().min(1),
});

function verifyTelegramAuth(data: Record<string, string>, botToken: string): boolean {
  const checkHash = data.hash;
  if (!checkHash) return false;

  const dataCheckArr = Object.entries(data)
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);

  const dataCheckString = dataCheckArr.join('\n');
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(checkHash, 'hex'))) return false;

  const authDate = parseInt(data.auth_date, 10);
  if (isNaN(authDate) || authDate <= 0) return false;
  const now = Math.floor(Date.now() / 1000);
  if (authDate > now + 60) return false;
  if (now - authDate > 86400) return false;

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    const parsed = telegramAuthSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    if (!verifyTelegramAuth(rawBody, botToken)) {
      return NextResponse.json({ error: 'Invalid authentication data' }, { status: 401 });
    }

    const { id: telegramId, first_name, last_name, username, photo_url, auth_date } = parsed.data;

    await db.insert(telegramUsers).values({
      telegramId,
      firstName: first_name,
      lastName: last_name || null,
      username: username || null,
      photoUrl: photo_url || null,
      authDate: auth_date,
    }).onConflictDoUpdate({
      target: telegramUsers.telegramId,
      set: {
        firstName: first_name,
        lastName: last_name || null,
        username: username || null,
        photoUrl: photo_url || null,
        authDate: auth_date,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        telegramId,
        firstName: first_name,
        lastName: last_name || null,
        username: username || null,
        photoUrl: photo_url || null,
      },
    });
  } catch (err: unknown) {
    console.error('Telegram auth error:', err);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
