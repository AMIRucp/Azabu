// Top-3 podium. Rank 1 is visually elevated via the [data-rank="1"] CSS hook.

import { formatUsdCompact, formatXpCompact, formatLevel, tierLabel } from "@/services/leaderboardService";
import type { RankedEntry } from "@/types/leaderboard";
import { BadgeDots, TraderAvatar } from "./parts";

const ACCENT_BY_RANK: Record<number, "gold" | "silver" | "bronze"> = {
  1: "gold",
  2: "silver",
  3: "bronze",
};

function PodiumCard({ entry }: { entry: RankedEntry }) {
  return (
    <article
      className="lb-podium-card"
      data-rank={entry.rank}
      data-accent={ACCENT_BY_RANK[entry.rank] ?? "bronze"}
    >
      <span className="lb-podium-rank">{entry.rank}</span>
      <TraderAvatar seed={entry.id} initials={entry.initials} size={48} />
      <h3 className="lb-podium-name">{entry.handle}</h3>
      <BadgeDots badges={entry.badges} extra={entry.extraBadges} />
      <p className="lb-podium-vol">{formatUsdCompact(entry.volume)}</p>
      <span className="lb-podium-vol-label">Volume</span>
      <p className="lb-podium-xp">{formatXpCompact(entry.xp)}</p>
      <span className="lb-podium-tier">
        {formatLevel(entry.level)} · {tierLabel(entry.tier)}
      </span>
    </article>
  );
}

export function Podium({ entries }: { entries: RankedEntry[] }) {
  return (
    <div className="lb-podium-wrap">
      <div className="lb-podium-glow" aria-hidden />
      <div className="lb-podium">
        {entries.map((entry) => (
          <PodiumCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
