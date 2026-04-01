import { db } from '@server/db';
import { asterConnections } from '@shared/schema';
import { decryptCredentials } from '@server/encryption';
import { eq } from 'drizzle-orm';
import type { AsterCredentials } from '@server/asterService';

export async function resolveAsterCredentials(userId: string): Promise<AsterCredentials | null> {
  try {
    const rows = await db.select().from(asterConnections).where(eq(asterConnections.userId, userId)).limit(1);
    if (rows.length > 0) {
      const conn = rows[0];
      return decryptCredentials(conn.apiKeyEnc, conn.apiSecretEnc, conn.iv, conn.authTag);
    }
  } catch (err) {
    console.error('[Aster] DB credentials lookup failed:', err);
  }

  const envKey = process.env.ASTER_API_KEY;
  const envSecret = process.env.ASTER_API_SECRET;
  if (envKey && envSecret) {
    return { apiKey: envKey, apiSecret: envSecret };
  }

  return null;
}
