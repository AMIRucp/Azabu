// Domain types for the Leaderboard screen.
// Kept transport-agnostic so the same shapes back both the sample data and a
// future API response (see services/leaderboardService.ts).

import type { TierName } from "@/services/avatarGenerator";

/** Tier identifiers reuse the canonical set defined in xpService / avatarGenerator. */
export type LeaderboardTier = TierName;

/** Which column the board is ranked by. */
export type LeaderboardMetric = "xp" | "volume" | "pnl";

/** Time window the board covers. */
export type LeaderboardPeriod = "weekly" | "monthly" | "all";

/** A single trader row. All values are raw — formatting happens in the view layer. */
export interface LeaderboardEntry {
  /** Stable id — wallet address or backend id. */
  id: string;
  /** Display name (handle or shortened address). */
  handle: string;
  /** Raw wallet address, when available (used for avatar seed + search). */
  address?: string;
  /** Pre-computed avatar initials. */
  initials: string;
  /** USD traded volume for the period. */
  volume: number;
  /** Realised PnL in USD (may be negative). */
  pnlUsd: number;
  /** PnL as a percentage (may be negative). */
  pnlPct: number;
  wins: number;
  losses: number;
  level: number;
  xp: number;
  tier: LeaderboardTier;
  /** Achievement keys rendered as coloured dots (see BADGE_COLORS). */
  badges: string[];
  /** Count of additional badges beyond the visible dots ("+3"). */
  extraBadges?: number;
}

/** The signed-in user's standing, shown in the hero card. */
export interface CurrentUserRank extends LeaderboardEntry {
  rank: number;
  /** Progress through the current tier, 0–1. */
  progress: number;
  nextTier: LeaderboardTier | null;
  xpToNextTier: number;
}

export interface EpochInfo {
  number: number;
  /** e.g. "20 Apr – 27 Apr 2026". */
  label: string;
  /** e.g. "Resets Monday 00:00 UTC". */
  resetsLabel: string;
}

/** Full payload for one period — what the API (or sample loader) returns. */
export interface LeaderboardData {
  epoch: EpochInfo;
  entries: LeaderboardEntry[];
  currentUser: CurrentUserRank;
}

/** An entry with its computed position in the current ranking. */
export type RankedEntry = LeaderboardEntry & { rank: number };
