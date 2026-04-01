import { NextRequest, NextResponse } from 'next/server';
import { db } from '@server/db';
import { asterConnections } from '@shared/schema';
import { encryptCredentials } from '@server/encryption';
import { eq } from 'drizzle-orm';
import { logSecurityEvent } from '@server/security';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, apiKey, apiSecret } = body;

    if (!userId || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'userId, apiKey, apiSecret required' }, { status: 400 });
    }

    if (typeof userId !== 'string' || userId.length > 100 ||
        typeof apiKey !== 'string' || apiKey.length > 200 ||
        typeof apiSecret !== 'string' || apiSecret.length > 200) {
      logSecurityEvent('INVALID_CONNECT_PARAMS', req);
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const encrypted = encryptCredentials(apiKey, apiSecret);

    const existing = await db.select().from(asterConnections).where(eq(asterConnections.userId, userId)).limit(1);

    if (existing.length > 0) {
      await db.update(asterConnections)
        .set({
          apiKeyEnc: encrypted.apiKeyEnc,
          apiSecretEnc: encrypted.apiSecretEnc,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          updatedAt: new Date(),
        })
        .where(eq(asterConnections.userId, userId));
    } else {
      await db.insert(asterConnections).values({
        userId,
        apiKeyEnc: encrypted.apiKeyEnc,
        apiSecretEnc: encrypted.apiSecretEnc,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Aster connect error:', message);
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
  }
}
