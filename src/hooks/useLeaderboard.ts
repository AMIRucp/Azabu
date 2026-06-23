"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboard } from "@/services/leaderboardService";
import type {
  LeaderboardMetric,
  LeaderboardPeriod,
  RankedEntry,
} from "@/types/leaderboard";

/** Rows per page — the table paginates once the ranking exceeds this. */
export const LEADERBOARD_PAGE_SIZE = 20;

/** Above this many rows on a page, the table body becomes a scroll area. */
export const LEADERBOARD_SCROLL_THRESHOLD = 20;

function sortByMetric(metric: LeaderboardMetric) {
  return (a: { xp: number; volume: number; pnlUsd: number }, b: typeof a) => {
    switch (metric) {
      case "volume":
        return b.volume - a.volume;
      case "pnl":
        return b.pnlUsd - a.pnlUsd;
      case "xp":
      default:
        return b.xp - a.xp;
    }
  };
}

/**
 * Owns the leaderboard's view state (metric / period / search) and derives the
 * ranked + filtered rows. Ranks are assigned from the full sorted list so a
 * search still shows each trader's true position.
 */
export function useLeaderboard() {
  const [metric, setMetric] = useState<LeaderboardMetric>("xp");
  const [period, setPeriod] = useState<LeaderboardPeriod>("weekly");
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () => fetchLeaderboard(period),
  });

  const entries = query.data?.entries;

  const ranked = useMemo<RankedEntry[]>(() => {
    if (!entries) return [];
    return [...entries]
      .sort(sortByMetric(metric))
      .map((entry, i) => ({ ...entry, rank: i + 1 }));
  }, [entries, metric]);

  const podium = useMemo(() => ranked.slice(0, 3), [ranked]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter(
      (e) =>
        e.handle.toLowerCase().includes(q) ||
        (e.address ?? "").toLowerCase().includes(q),
    );
  }, [ranked, search]);

  /* ------------------------------ pagination ----------------------------- */
  const [page, setPage] = useState(1);

  // any change to the filtered/sorted set sends us back to the first page
  useEffect(() => {
    setPage(1);
  }, [metric, period, search]);

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / LEADERBOARD_PAGE_SIZE));

  // clamp if the current page falls out of range (e.g. data shrank)
  const currentPage = Math.min(page, totalPages);

  const pageRows = useMemo(
    () =>
      rows.slice(
        (currentPage - 1) * LEADERBOARD_PAGE_SIZE,
        currentPage * LEADERBOARD_PAGE_SIZE,
      ),
    [rows, currentPage],
  );

  return {
    // view state
    metric,
    setMetric,
    period,
    setPeriod,
    search,
    setSearch,
    // derived data (rows is the current page only)
    podium,
    rows: pageRows,
    epoch: query.data?.epoch,
    currentUser: query.data?.currentUser,
    // pagination
    page: currentPage,
    setPage,
    totalPages,
    totalRows,
    pageSize: LEADERBOARD_PAGE_SIZE,
    scrollThreshold: LEADERBOARD_SCROLL_THRESHOLD,
    // status
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
