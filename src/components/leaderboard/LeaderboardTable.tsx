// The ranked table. Header is defined once as data so columns stay in sync.

import {
  formatLevel,
  formatUsdCompact,
  formatXpCompact,
} from "@/services/leaderboardService";
import { LEADERBOARD_SCROLL_THRESHOLD } from "@/hooks/useLeaderboard";
import type { RankedEntry } from "@/types/leaderboard";
import { BadgeDots, PnlText, TierBadge, TraderAvatar } from "./parts";

function Row({ entry }: { entry: RankedEntry }) {
  return (
    <div className="lb-row">
      <div className="lb-cell lb-cell--rank" data-rank={entry.rank}>
        {entry.rank}
      </div>

      <div className="lb-cell lb-cell--trader">
        <TraderAvatar seed={entry.id} initials={entry.initials} />
        <div className="lb-trader-info">
          <span className="lb-trader-name">{entry.handle}</span>
          <BadgeDots badges={entry.badges} extra={entry.extraBadges} />
        </div>
      </div>

      <div className="lb-cell lb-cell--num">{formatUsdCompact(entry.volume)}</div>
      <div className="lb-cell lb-cell--num">
        <PnlText value={entry.pnlUsd} format="usd" />
      </div>
      <div className="lb-cell lb-cell--num">
        <PnlText value={entry.pnlPct} format="pct" />
      </div>
      <div className="lb-cell lb-cell--num lb-cell--muted">
        {entry.wins} / {entry.losses}
      </div>

      <div className="lb-cell lb-cell--level">
        <div className="lb-level-line">
          <span className="lb-level-tag">{formatLevel(entry.level)}</span>
          <TierBadge tier={entry.tier} />
        </div>
        <span className="lb-level-xp">{formatXpCompact(entry.xp)}</span>
      </div>
    </div>
  );
}

export function LeaderboardTable({ rows }: { rows: RankedEntry[] }) {
  return (
    <section className="lb-table">
      <div className="lb-thead">
        <div className="lb-th lb-th--rank">#</div>
        <div className="lb-th">Trader</div>
        <div className="lb-th lb-th--num">Volume</div>
        <div className="lb-th lb-th--num">PnL $</div>
        <div className="lb-th lb-th--num">PnL %</div>
        <div className="lb-th lb-th--num">Win/Loss</div>
        <div className="lb-th lb-th--level">Level / XP</div>
      </div>

      <div
        className="lb-tbody"
        data-scroll={rows.length > LEADERBOARD_SCROLL_THRESHOLD}
      >
        {rows.length === 0 ? (
          <div className="lb-empty">No traders match your search.</div>
        ) : (
          rows.map((entry) => <Row key={entry.id} entry={entry} />)
        )}
      </div>
    </section>
  );
}
