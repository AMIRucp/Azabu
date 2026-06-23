// Leaderboard data + presentation helpers.
//
// Today this serves deterministic sample data. To go live, replace the body of
// `fetchLeaderboard` with a real request (e.g. apiRequest("GET", `/api/leaderboard?period=${period}`))
// — nothing else in the UI needs to change because everything consumes the
// typed shapes from types/leaderboard.ts.

import type {
  LeaderboardData,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardTier,
} from "@/types/leaderboard";

/* ----------------------------- tier metadata ----------------------------- */

/** Human label for a tier ("elite" -> "Elite"). */
export function tierLabel(tier: LeaderboardTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

/* --------------------------- achievement dots ---------------------------- */
// Badge keys map to CSS theme tokens so dot colours stay on-theme and themeable.
export const BADGE_COLORS: Record<string, string> = {
  volume: "var(--tier-elite)",   // amber
  trades: "var(--tier-trader)",  // blue
  streak: "var(--success)",      // green
  pnl: "var(--tier-pro)",        // purple
  social: "var(--badge-pink)",   // pink
};

export function badgeColor(key: string): string {
  return BADGE_COLORS[key] ?? "var(--text-muted)";
}

/* ------------------------------- avatars --------------------------------- */

function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic two-tone gradient for an avatar, derived from a stable seed. */
export function avatarGradient(seed: string): string {
  const h = hashSeed(seed);
  const hue = h % 360;
  const hue2 = (hue + 38) % 360;
  return `linear-gradient(135deg, hsl(${hue} 68% 55%), hsl(${hue2} 62% 42%))`;
}

/* ------------------------------ formatters ------------------------------- */

/** $5.80M · $640k · $84.2k · $95k */
export function formatUsdCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) {
    const k = n / 1_000;
    return Number.isInteger(k) ? `$${k}k` : `$${k.toFixed(1)}k`;
  }
  return `$${n.toLocaleString("en-US")}`;
}

/** +$142,400 · -$4,200 */
export function formatUsdSigned(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US")}`;
}

/** +84.2% · -8.4% */
export function formatPct(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}${Math.abs(n).toFixed(1)}%`;
}

/** 320.0k XP · 8.2k XP */
export function formatXpCompact(xp: number): string {
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}k XP`;
  return `${xp.toLocaleString("en-US")} XP`;
}

/** 3,240 XP (full, for the hero card subtitle). */
export function formatXpFull(xp: number): string {
  return `${xp.toLocaleString("en-US")} XP`;
}

export function formatLevel(level: number): string {
  return `L${level}`;
}

/* ------------------------------ sample data ------------------------------ */

const SAMPLE_ENTRIES: LeaderboardEntry[] = [
  { id: "miyamotox", handle: "MiyamotoX", initials: "MX", volume: 5_800_000, pnlUsd: 142_400, pnlPct: 84.2, wins: 62, losses: 18, level: 52, xp: 320_000, tier: "elite", badges: ["volume", "trades", "streak", "pnl"], extraBadges: 3 },
  { id: "shogunbull", handle: "ShogunBull", initials: "SB", volume: 2_200_000, pnlUsd: 88_200, pnlPct: 61.4, wins: 44, losses: 12, level: 43, xp: 180_000, tier: "pro", badges: ["volume", "trades", "pnl"], extraBadges: 2 },
  { id: "ninjavault", handle: "NinjaVault", initials: "NV", volume: 1_100_000, pnlUsd: 44_100, pnlPct: 38.7, wins: 31, losses: 9, level: 35, xp: 95_000, tier: "pro", badges: ["volume", "social", "trades"], extraBadges: 2 },
  { id: "0x8g9h", handle: "0x8G9H...0I1J", address: "0x8G9H0I1J", initials: "0x", volume: 640_000, pnlUsd: 28_800, pnlPct: 22.1, wins: 22, losses: 14, level: 22, xp: 42_000, tier: "trader", badges: ["volume", "trades"], extraBadges: 1 },
  { id: "sakuradegen", handle: "SakuraDegen", initials: "SD", volume: 280_000, pnlUsd: -4_200, pnlPct: -8.4, wins: 11, losses: 18, level: 18, xp: 18_500, tier: "trader", badges: ["volume", "social", "streak"] },
  { id: "ichibanhodl", handle: "IchibanHODL", initials: "IH", volume: 95_000, pnlUsd: 3_800, pnlPct: 12.3, wins: 9, losses: 6, level: 13, xp: 8_200, tier: "challenger", badges: ["volume", "trades"] },
  { id: "roninblade", handle: "RoninBlade", initials: "RB", volume: 1_450_000, pnlUsd: 51_300, pnlPct: 41.2, wins: 34, losses: 11, level: 38, xp: 112_000, tier: "pro", badges: ["volume", "pnl", "streak"], extraBadges: 1 },
  { id: "kogapips", handle: "KogaPips", initials: "KP", volume: 880_000, pnlUsd: 33_900, pnlPct: 29.4, wins: 27, losses: 13, level: 31, xp: 76_400, tier: "pro", badges: ["trades", "volume"], extraBadges: 2 },
  { id: "0x4a7b", handle: "0x4A7B...9C2D", address: "0x4A7B9C2D", initials: "0x", volume: 540_000, pnlUsd: 19_700, pnlPct: 18.9, wins: 21, losses: 12, level: 26, xp: 51_300, tier: "trader", badges: ["volume", "social"], extraBadges: 1 },
  { id: "samuraiyield", handle: "SamuraiYield", initials: "SY", volume: 410_000, pnlUsd: 14_200, pnlPct: 16.1, wins: 19, losses: 10, level: 24, xp: 38_900, tier: "trader", badges: ["trades", "streak"] },
  { id: "bushidobtc", handle: "BushidoBTC", initials: "BB", volume: 360_000, pnlUsd: 12_050, pnlPct: 13.7, wins: 17, losses: 11, level: 21, xp: 33_100, tier: "trader", badges: ["volume", "pnl", "trades"], extraBadges: 1 },
  { id: "0x9f1e", handle: "0x9F1E...3B8A", address: "0x9F1E3B8A", initials: "0x", volume: 245_000, pnlUsd: 8_640, pnlPct: 11.2, wins: 14, losses: 9, level: 19, xp: 24_700, tier: "trader", badges: ["social"] },
  { id: "tanakapump", handle: "TanakaPump", initials: "TP", volume: 188_000, pnlUsd: 6_300, pnlPct: 9.6, wins: 12, losses: 8, level: 16, xp: 19_800, tier: "challenger", badges: ["volume", "trades"] },
  { id: "kitsunelong", handle: "KitsuneLong", initials: "KL", volume: 142_000, pnlUsd: -2_100, pnlPct: -4.7, wins: 8, losses: 12, level: 15, xp: 15_600, tier: "challenger", badges: ["streak"] },
  { id: "0x2c6d", handle: "0x2C6D...7E4F", address: "0x2C6D7E4F", initials: "0x", volume: 118_000, pnlUsd: 4_120, pnlPct: 8.1, wins: 10, losses: 7, level: 14, xp: 12_900, tier: "challenger", badges: ["volume", "social"] },
  { id: "edomargin", handle: "EdoMargin", initials: "EM", volume: 86_500, pnlUsd: 2_540, pnlPct: 6.4, wins: 9, losses: 8, level: 12, xp: 9_400, tier: "challenger", badges: ["trades"] },
  { id: "geishaflip", handle: "GeishaFlip", initials: "GF", volume: 61_200, pnlUsd: 1_780, pnlPct: 5.2, wins: 7, losses: 6, level: 10, xp: 6_700, tier: "novice", badges: ["volume"] },
  { id: "0x7b3a", handle: "0x7B3A...1D9C", address: "0x7B3A1D9C", initials: "0x", volume: 44_800, pnlUsd: -980, pnlPct: -3.1, wins: 5, losses: 9, level: 8, xp: 4_900, tier: "novice", badges: ["social"] },
  { id: "shibatrader", handle: "ShibaTrader", initials: "ST", volume: 32_400, pnlUsd: 1_120, pnlPct: 7.8, wins: 6, losses: 4, level: 7, xp: 3_800, tier: "novice", badges: ["streak", "trades"] },
  { id: "zenscalper", handle: "ZenScalper", initials: "ZS", volume: 21_900, pnlUsd: 640, pnlPct: 4.3, wins: 4, losses: 5, level: 6, xp: 2_600, tier: "novice", badges: ["volume"] },
  { id: "novicekira", handle: "NoviceKira", initials: "NK", volume: 12_300, pnlUsd: 210, pnlPct: 2.1, wins: 3, losses: 4, level: 4, xp: 1_400, tier: "novice", badges: [] },
];

const SAMPLE_DATA: LeaderboardData = {
  epoch: {
    number: 20,
    label: "20 Apr – 27 Apr 2026",
    resetsLabel: "Resets Monday 00:00 UTC",
  },
  entries: SAMPLE_ENTRIES,
  currentUser: {
    id: "rylan-cross",
    handle: "Rylan Cross",
    initials: "RC",
    rank: 14,
    volume: 84_200,
    pnlUsd: 1_240,
    pnlPct: 14.6,
    wins: 18,
    losses: 7,
    level: 18,
    xp: 3_240,
    tier: "trader",
    badges: [],
    progress: 0.6,
    nextTier: "pro",
    xpToNextTier: 2_180,
  },
};

/**
 * Load the leaderboard for a period.
 * Currently returns sample data; swap the body for a network call to go live.
 */
export async function fetchLeaderboard(_period: LeaderboardPeriod): Promise<LeaderboardData> {
  // const res = await apiRequest("GET", `/api/leaderboard?period=${_period}`);
  // return res.json();
  return SAMPLE_DATA;
}
