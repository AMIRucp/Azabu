import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../server/db";
import { leaderboardEntries, trades } from "@shared/schema";
import { desc, sql, eq } from "drizzle-orm";

export const runtime = "nodejs";

// GET /api/leaderboard?tab=xp|volume&limit=50&wallet=0x...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") ?? "xp";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const callerWallet = searchParams.get("wallet");

    // Get top entries
    let entries;
    if (tab === "volume") {
      entries = await db
        .select()
        .from(leaderboardEntries)
        .orderBy(desc(leaderboardEntries.volumeTotal))
        .limit(limit);
    } else {
      entries = await db
        .select()
        .from(leaderboardEntries)
        .orderBy(desc(leaderboardEntries.xpTotal))
        .limit(limit);
    }

    const ranked = entries.map((e, i) => ({
      rank: i + 1,
      walletAddress: e.walletAddress,
      callsign: e.callsign,
      pfpId: e.pfpId,
      xpTotal: e.xpTotal,
      level: e.level,
      tierBadge: e.tierBadge,
      rankName: e.rankName,
      volumeTotal: Number(e.volumeTotal),
      weeklyXp: e.weeklyXp,
      achievements: e.achievements ?? [],
      updatedAt: e.updatedAt,
    }));

    // Caller's rank
    let callerRank: number | null = null;
    if (callerWallet) {
      const allByXp = await db
        .select({ wallet: leaderboardEntries.walletAddress })
        .from(leaderboardEntries)
        .orderBy(desc(leaderboardEntries.xpTotal));
      const idx = allByXp.findIndex(
        (e) => e.wallet.toLowerCase() === callerWallet.toLowerCase()
      );
      callerRank = idx !== -1 ? idx + 1 : null;
    }

    return NextResponse.json({ entries: ranked, callerRank, tab });
  } catch (err) {
    console.error("Leaderboard API error:", err);
    return NextResponse.json({ entries: [], callerRank: null, tab: "xp" });
  }
}

// POST /api/leaderboard — upsert a wallet entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      walletAddress, callsign, pfpId,
      xpTotal, level, tierBadge, rankName,
      volumeTotal, weeklyXp, weekStart, achievements,
    } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress required" }, { status: 400 });
    }

    await db
      .insert(leaderboardEntries)
      .values({
        walletAddress,
        callsign: callsign ?? null,
        pfpId: pfpId ?? null,
        xpTotal: xpTotal ?? 0,
        level: level ?? 1,
        tierBadge: tierBadge ?? "tier-novice",
        rankName: rankName ?? "Novice",
        volumeTotal: String(volumeTotal ?? 0),
        weeklyXp: weeklyXp ?? 0,
        weekStart: weekStart ?? null,
        achievements: achievements ?? [],
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: leaderboardEntries.walletAddress,
        set: {
          callsign: sql`EXCLUDED.callsign`,
          pfpId: sql`EXCLUDED.pfp_id`,
          xpTotal: sql`EXCLUDED.xp_total`,
          level: sql`EXCLUDED.level`,
          tierBadge: sql`EXCLUDED.tier_badge`,
          rankName: sql`EXCLUDED.rank_name`,
          volumeTotal: sql`EXCLUDED.volume_total`,
          weeklyXp: sql`EXCLUDED.weekly_xp`,
          weekStart: sql`EXCLUDED.week_start`,
          achievements: sql`EXCLUDED.achievements`,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Leaderboard upsert error:", err);
    return NextResponse.json({ error: "Failed to upsert" }, { status: 500 });
  }
}
