// Shared presentational atoms for the leaderboard. Pure + data-driven; all
// colour comes from theme tokens via leaderboardService helpers.

import {
  avatarGradient,
  badgeColor,
  formatPct,
  formatUsdSigned,
  tierLabel,
} from "@/services/leaderboardService";
import type { LeaderboardTier } from "@/types/leaderboard";

export function TraderAvatar({
  seed,
  initials,
  size = 34,
}: {
  seed: string;
  initials: string;
  size?: number;
}) {
  return (
    <span
      className="lb-avatar"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.34),
        background: avatarGradient(seed),
      }}
    >
      {initials}
    </span>
  );
}

export function TierBadge({ tier }: { tier: LeaderboardTier }) {
  return (
    <span className="lb-tier" data-tier={tier}>
      {tierLabel(tier)}
    </span>
  );
}

export function BadgeDots({ badges, extra }: { badges: string[]; extra?: number }) {
  if (!badges.length) return null;
  return (
    <span className="lb-dots">
      {badges.map((key, i) => (
        <i key={`${key}-${i}`} style={{ background: badgeColor(key) }} />
      ))}
      {extra ? <em>+{extra}</em> : null}
    </span>
  );
}

export interface SegmentedOption<T extends string> {
  label: string;
  /** Shorter label shown on very small screens (falls back to `label`). */
  short?: string;
  value: T;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = "metric",
  ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: "metric" | "period";
  ariaLabel?: string;
}) {
  return (
    <div className="lb-segmented" data-variant={variant} role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={opt.value === value}
          className="lb-seg-btn"
          data-active={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          <span className="lb-seg-full">{opt.label}</span>
          <span className="lb-seg-short">{opt.short ?? opt.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Signed money / percentage value with positive/negative theme colouring. */
export function PnlText({
  value,
  format,
}: {
  value: number;
  format: "usd" | "pct";
}) {
  const text = format === "usd" ? formatUsdSigned(value) : formatPct(value);
  return <span className={value >= 0 ? "lb-pos" : "lb-neg"}>{text}</span>;
}

export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pos" | "neg";
}) {
  return (
    <div className="lb-stat">
      <span className="lb-stat-label">{label}</span>
      <span className={`lb-stat-val${tone ? ` lb-${tone}` : ""}`}>{value}</span>
    </div>
  );
}
