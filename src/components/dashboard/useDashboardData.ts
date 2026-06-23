"use client";

import { useEffect, useMemo, useState } from "react";
import { TRENDING_PERP_BASES } from "@/config/trendingPerps";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { applyLiveQuote, getHyperliquidPerps } from "@/lib/resolveHyperliquidMarket";
import usePositionStore from "@/stores/usePositionStore";
import useMarketStore from "@/stores/useMarketStore";
import useUserStore from "@/stores/useUserStore";
import {
  DEMO_LEADERBOARD,
  DEMO_PORTFOLIO,
  DEMO_TRENDING,
} from "./demoData";

export type MoverTab = "gainers" | "losers" | "active";

export type LeaderboardEntry = {
  rank: number;
  callsign: string;
  xp: number;
};

export function useDashboardData() {
  const { evmAddress } = useEvmWallet();
  const {
    totalNetWorth,
    freeMargin,
    usedCollateral,
    balancesLoading,
    hlLoading,
    unrealizedPnl: liveUnrealisedPnl,
  } = usePortfolioData();
  const positions = usePositionStore((s) => s.positions);
  const positionsLoading = !!evmAddress && hlLoading && positions.length === 0;
  const positionCount = usePositionStore((s) => s.positionCount);
  const markets = useMarketStore((s) => s.markets);
  const livePrices = useMarketStore((s) => s.livePrices);
  const marketsLoading = useMarketStore((s) => s.isLoading);
  const marketsLoaded = useMarketStore((s) => s.hasLoaded);
  const startPolling = useMarketStore((s) => s.startPolling);
  const userXp = useUserStore((s) => s.xp);
  const callsign = useUserStore((s) => s.callsign);

  useEffect(() => startPolling(), [startPolling]);

  const [moverTab, setMoverTab] = useState<MoverTab>("gainers");
  const [callerRank, setCallerRank] = useState<number | null>(DEMO_PORTFOLIO.rank);
  const [topEntries, setTopEntries] = useState<LeaderboardEntry[]>([...DEMO_LEADERBOARD]);

  useEffect(() => {
    if (!evmAddress) return;
    fetch(`/api/leaderboard?tab=xp&wallet=${evmAddress}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.callerRank) setCallerRank(data.callerRank);
        if (data.entries?.length >= 3) {
          setTopEntries(
            data.entries.slice(0, 8).map((e: { rank: number; callsign: string | null; xpTotal: number }) => ({
              rank: e.rank,
              callsign: e.callsign || `Trader #${e.rank}`,
              xp: e.xpTotal,
            })),
          );
        }
      })
      .catch(() => {});
  }, [evmAddress]);

  const useDemo = !evmAddress;

  const marginTotal = freeMargin + usedCollateral;
  const liveMarginRatioPct = marginTotal > 0 ? (usedCollateral / marginTotal) * 100 : 0;
  const liveFreeMarginPct = marginTotal > 0 ? (freeMargin / marginTotal) * 100 : 100;
  const liveTodayPnlPct = totalNetWorth > 0 ? (liveUnrealisedPnl / totalNetWorth) * 100 : 0;

  const portfolioValue = useDemo ? DEMO_PORTFOLIO.portfolio : totalNetWorth;
  const todayPnl = useDemo ? DEMO_PORTFOLIO.todayPnl : liveUnrealisedPnl;
  const todayPnlPct = useDemo ? DEMO_PORTFOLIO.todayPnlPct : liveTodayPnlPct;
  const unrealisedPnl = useDemo ? DEMO_PORTFOLIO.unrealisedPnl : liveUnrealisedPnl;
  const displayPositionCount = useDemo ? DEMO_PORTFOLIO.positionCount : positionCount;
  const displayFreeMargin = useDemo ? DEMO_PORTFOLIO.freeMargin : freeMargin;
  const freeMarginPct = useDemo ? DEMO_PORTFOLIO.freeMarginPct : liveFreeMarginPct;
  const marginRatioPct = useDemo ? DEMO_PORTFOLIO.marginRatioPct : liveMarginRatioPct;

  const trendingCards = useMemo(() => {
    return TRENDING_PERP_BASES.map((base) => {
      const market = markets.find(
        (m) => m.baseAsset === base && m.protocol === "hyperliquid" && m.type === "perp" && m.price > 0,
      );
      if (market) {
        const live = applyLiveQuote(market, livePrices);
        return {
          baseAsset: base,
          price: live.price,
          change24h: live.change24h,
          volume24h: live.volume24h,
          oi: live.openInterest ?? 0,
          symbol: live.symbol,
        };
      }

      const demo = DEMO_TRENDING.find((d) => d.base === base);
      if (!demo) return null;
      return {
        baseAsset: demo.base,
        price: demo.price,
        change24h: demo.change24h,
        volume24h: demo.volume24h,
        oi: demo.oi,
        symbol: `${demo.base}-PERP`,
      };
    }).filter((card): card is NonNullable<typeof card> => card !== null);
  }, [markets, livePrices]);

  const movers = useMemo(() => {
    const perps = getHyperliquidPerps(markets, livePrices);
    if (perps.length === 0) return [];

    const sorted =
      moverTab === "gainers"
        ? [...perps].sort((a, b) => b.change24h - a.change24h)
        : moverTab === "losers"
          ? [...perps].sort((a, b) => a.change24h - b.change24h)
          : [...perps].sort((a, b) => b.volume24h - a.volume24h);
    return sorted.slice(0, 5);
  }, [markets, livePrices, moverTab]);

  const openPositions = positions.slice(0, 3);
  const displayXp = useDemo ? DEMO_PORTFOLIO.xp : userXp > 0 ? userXp : DEMO_PORTFOLIO.xp;
  const proTarget = DEMO_PORTFOLIO.xp + DEMO_PORTFOLIO.xpToPro;
  const xpToPro = Math.max(0, proTarget - displayXp);
  const displayHandle = callsign || DEMO_PORTFOLIO.handle;

  return {
    balancesLoading,
    useDemo,
    moverTab,
    setMoverTab,
    callerRank,
    topEntries,
    portfolioValue,
    todayPnl,
    todayPnlPct,
    unrealisedPnl,
    displayPositionCount,
    displayFreeMargin,
    freeMarginPct,
    marginRatioPct,
    trendingCards,
    movers,
    moversLoading: marketsLoading && !marketsLoaded,
    openPositions,
    positionsLoading,
    displayXp,
    proTarget,
    xpToPro,
    displayHandle,
  };
}
