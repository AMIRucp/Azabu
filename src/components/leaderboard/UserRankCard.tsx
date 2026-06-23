// Hero card: the signed-in user's standing for the current epoch.

import {
  formatLevel,
  formatUsdCompact,
  formatUsdSigned,
  formatXpFull,
  tierLabel,
} from "@/services/leaderboardService";
import type { CurrentUserRank } from "@/types/leaderboard";
import { Stat } from "./parts";

export function UserRankCard({ user }: { user: CurrentUserRank }) {
  const nextLabel = user.nextTier ? tierLabel(user.nextTier) : "max";

  return (
    <section className="lb-rank-card">
      <span className="lb-rank-num">#{user.rank}</span>
      <span className="lb-avatar lb-rank-avatar">{user.initials}</span>

      <div className="lb-rank-id">
        <h3>{user.handle}</h3>
        <p>
          {formatLevel(user.level)} {tierLabel(user.tier)} ·{" "}
          {formatXpFull(user.xp)} ·{" "}
          <span className="lb-xp-to-next">
            {user.xpToNextTier.toLocaleString("en-US")} XP to {nextLabel}
          </span>
        </p>
        <div className="lb-progress-labels">
          <span>{tierLabel(user.tier).toUpperCase()}</span>
          <span className="pro">
            {user.nextTier ? tierLabel(user.nextTier).toUpperCase() : "MAX"}
          </span>
        </div>
        <div className="lb-progress">
          <div
            className="lb-progress-fill"
            style={{ width: `${Math.round(user.progress * 100)}%` }}
          />
        </div>
      </div>

      <div className="lb-rank-stats">
        <Stat label="Volume" value={formatUsdCompact(user.volume)} />
        <Stat
          label="PnL"
          value={formatUsdSigned(user.pnlUsd)}
          tone={user.pnlUsd >= 0 ? "pos" : "neg"}
        />
        <Stat label="Win/Loss" value={`${user.wins} / ${user.losses}`} />
      </div>
    </section>
  );
}
