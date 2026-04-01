import { db } from "./db";
import { rateLimits } from "@shared/schema";
import { eq, and, gt, sql } from "drizzle-orm";

const RATE_LIMIT_WINDOW_MS = 60_000;

export async function checkRateLimit(
  key: string,
  maxRequests: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

  try {
    const result = await db
      .insert(rateLimits)
      .values({
        key,
        count: 1,
        windowStart: now,
      })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`CASE WHEN ${rateLimits.windowStart} < ${windowStart} THEN 1 ELSE ${rateLimits.count} + 1 END`,
          windowStart: sql`CASE WHEN ${rateLimits.windowStart} < ${windowStart} THEN ${now} ELSE ${rateLimits.windowStart} END`,
        },
      })
      .returning({
        count: rateLimits.count,
        windowStart: rateLimits.windowStart,
      });

    const entry = result[0];
    if (!entry) {
      return { allowed: true, remaining: maxRequests - 1, resetAt: now.getTime() + RATE_LIMIT_WINDOW_MS };
    }

    const resetAt = new Date(entry.windowStart).getTime() + RATE_LIMIT_WINDOW_MS;
    const remaining = Math.max(0, maxRequests - entry.count);

    return {
      allowed: entry.count <= maxRequests,
      remaining,
      resetAt,
    };
  } catch (e: unknown) {
    console.error("[RATE_LIMIT] DB error, falling back to allow:", e instanceof Error ? e.message : "unknown");
    return { allowed: true, remaining: maxRequests, resetAt: now.getTime() + RATE_LIMIT_WINDOW_MS };
  }
}

export async function cleanupExpiredLimits(): Promise<void> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS * 2);
  try {
    await db.delete(rateLimits).where(
      gt(sql`${windowStart}`, rateLimits.windowStart)
    );
  } catch (e: unknown) {
    console.error("[RATE_LIMIT] Cleanup error:", e instanceof Error ? e.message : "unknown");
  }
}

setInterval(() => {
  cleanupExpiredLimits().catch(() => {});
}, 5 * 60_000);
