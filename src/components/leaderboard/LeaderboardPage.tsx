"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import type { LeaderboardMetric, LeaderboardPeriod } from "@/types/leaderboard";
import { LeaderboardTable } from "./LeaderboardTable";
import { Podium } from "./Podium";
import { SegmentedControl, type SegmentedOption } from "./parts";
import { UserRankCard } from "./UserRankCard";
import "./LeaderboardPage.css";

const METRIC_OPTIONS: SegmentedOption<LeaderboardMetric>[] = [
  { label: "XP Score", short: "XP", value: "xp" },
  { label: "Volume", short: "Vol", value: "volume" },
  { label: "PnL", short: "PnL", value: "pnl" },
];

const PERIOD_OPTIONS: SegmentedOption<LeaderboardPeriod>[] = [
  { label: "Weekly", short: "W", value: "weekly" },
  { label: "Monthly", short: "M", value: "monthly" },
  { label: "All Time", short: "AT", value: "all" },
];

// Rendered inside the app shell (which provides the real header + scroll area),
// so this is just the page content — no header or page/scroll wrappers here.
export default function LeaderboardPage() {
  const {
    metric,
    setMetric,
    period,
    setPeriod,
    search,
    setSearch,
    podium,
    rows,
    epoch,
    currentUser,
    isLoading,
    page,
    setPage,
    totalPages,
    totalRows,
    pageSize,
  } = useLeaderboard();

  return (
    <div className="lb-root">
      <main className="lb-body lb-shell">
        <section className="lb-intro">
          <div className="lb-intro-left">
            <div>
              <h1 className="lb-title">
                Leader<span>board</span>
              </h1>
              {epoch && (
                <p className="lb-epoch">
                  Epoch {epoch.number} ·{" "}
                  <span className="lb-epoch-dates">{epoch.label}</span> ·{" "}
                  {epoch.resetsLabel}
                </p>
              )}
            </div>
            {currentUser && <UserRankCard user={currentUser} />}
          </div>

          {podium.length > 0 && <Podium entries={podium} />}
        </section>

        <section className="lb-toolbar">
          <SegmentedControl
            ariaLabel="Rank by"
            variant="metric"
            options={METRIC_OPTIONS}
            value={metric}
            onChange={setMetric}
          />
          <SegmentedControl
            ariaLabel="Time range"
            variant="period"
            options={PERIOD_OPTIONS}
            value={period}
            onChange={setPeriod}
          />
          <label className="lb-search">
            <Search size={14} aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trader…"
              aria-label="Search trader"
            />
          </label>
        </section>

        {isLoading ? (
          <div className="lb-empty">Loading leaderboard…</div>
        ) : (
          <>
            <LeaderboardTable rows={rows} />
            {totalPages > 1 && (
              <nav className="lb-pagination" aria-label="Leaderboard pages">
                <button
                  type="button"
                  className="lb-page-btn"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} aria-hidden />
                </button>
                <span className="lb-page-info">
                  {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalRows)}
                  {" of "}
                  {totalRows}
                </span>
                <button
                  type="button"
                  className="lb-page-btn"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} aria-hidden />
                </button>
              </nav>
            )}
          </>
        )}
      </main>

      {/* decorative trophy, pinned to the bottom-left of the scroll viewport */}
      <div className="lb-trophy-layer" aria-hidden>
        <div className="lb-trophy" />
      </div>
    </div>
  );
}
