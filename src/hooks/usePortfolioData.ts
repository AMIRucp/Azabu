"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useEvmWallet } from "./useEvmWallet";
import usePositionStore, { type UnifiedPosition } from "@/stores/usePositionStore";
import { useHyperliquidPortfolio } from "./useHyperliquidPortfolio";
import { asterWalletHeaders } from "@/lib/asterClientHeaders";
import { parseAsterBalances, type AsterBalRow } from "@/lib/asterBalanceParse";

const QUOTE_SUFFIXES = ["USDT", "USDC", "BUSD", "FDUSD"] as const;

function asterSymbolBase(symbol: string): { base: string; quote: string } {
  const s = String(symbol).toUpperCase();
  for (const q of QUOTE_SUFFIXES) {
    if (s.endsWith(q)) {
      return { base: s.slice(0, -q.length), quote: q };
    }
  }
  return { base: s, quote: "USDT" };
}

function mapAsterPositionRiskRows(rows: unknown[]): UnifiedPosition[] {
  const out: UnifiedPosition[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const positionAmt = parseFloat(String(r.positionAmt ?? r.positionAMT ?? "0"));
    if (!Number.isFinite(positionAmt) || positionAmt === 0) continue;

    const symbolPair = String(r.symbol ?? "");
    const { base, quote } = asterSymbolBase(symbolPair);
    const entryPrice = parseFloat(String(r.entryPrice ?? "0"));
    const markPrice = parseFloat(String(r.markPrice ?? r.entryPrice ?? "0"));
    const lev = parseFloat(String(r.leverage ?? "1")) || 1;
    const absBase = Math.abs(positionAmt);
    const px = Number.isFinite(markPrice) && markPrice > 0 ? markPrice : entryPrice;
    const sizeUsd = absBase * (Number.isFinite(px) ? px : 0);
    const margin = lev > 0 ? sizeUsd / lev : sizeUsd;
    const liq = parseFloat(String(r.liquidationPrice ?? "0"));
    const uPnl = parseFloat(String(r.unRealizedProfit ?? r.unrealizedProfit ?? "0"));
    const roePct = margin > 0 && Number.isFinite(uPnl) ? (uPnl / margin) * 100 : 0;

    out.push({
      id: `aster-${symbolPair}`,
      protocol: "aster",
      chain: "Arbitrum",
      type: "perp",
      symbol: base,
      baseAsset: base,
      quoteAsset: quote,
      side: positionAmt > 0 ? "LONG" : "SHORT",
      leverage: lev,
      sizeBase: absBase,
      sizeUsd,
      margin,
      marginUsed: margin,
      marginRatio: 0,
      entryPrice: Number.isFinite(entryPrice) ? entryPrice : 0,
      markPrice: Number.isFinite(markPrice) ? markPrice : entryPrice,
      liquidationPrice: Number.isFinite(liq) ? liq : 0,
      liquidationDistance:
        markPrice > 0 && liq > 0 ? Math.abs((markPrice - liq) / markPrice) * 100 : 0,
      unrealizedPnl: Number.isFinite(uPnl) ? uPnl : 0,
      unrealizedPnlPercent: roePct,
      realizedPnl: 0,
      fundingPaid: 0,
      feesPaid: 0,
      totalPnl: Number.isFinite(uPnl) ? uPnl : 0,
      openedAt: Date.now(),
      duration: "Active",
      isCloseable: true,
      closeMethod: "api",
      isAtRisk: false,
      isCritical: false,
    });
  }
  return out;
}

export interface WalletToken {
  asset: string;
  chain: "Arbitrum" | "Hyperliquid";
  amount: number;
  price: number;
  valueUsd: number;
  change24h: number;
}

export interface ProtocolDeposit {
  protocol: string;
  chain: "Arbitrum" | "Hyperliquid";
  asset: string;
  totalDeposited: number;
  free: number;
  locked: number;
  utilizationPct: number;
  connected: boolean;
}

export interface PortfolioData {
  walletBalance: number;
  protocolDeposits: number;
  freeMargin: number;
  usedCollateral: number;
  availableFunds: number;
  totalNetWorth: number;
  walletTokens: WalletToken[];
  deposits: ProtocolDeposit[];
  sourceStatus: Record<string, string>;
  partialFailure: boolean;
}

export type ChainFilter = "all" | "Arbitrum" | "Ethereum" | "Hyperliquid";

export function usePortfolioData() {
  const { evmAddress } = useEvmWallet();
  const positions = usePositionStore((s) => s.positions);
  const setPositions = usePositionStore((s) => s.setPositions);
  const {
    account: hlAccountRaw,
    positions: hlPositions,
    data: hlPortfolioData,
    isLoading: hlLoading,
    refetch: refetchHl,
  } = useHyperliquidPortfolio({
    address: evmAddress || undefined,
    enabled: !!evmAddress,
    pollInterval: 30000,
  });

  const hlAccount = useMemo(() => {
    if (!evmAddress) return null;
    const respAddr = hlPortfolioData?.address;
    if (respAddr && respAddr.toLowerCase() !== evmAddress.toLowerCase()) return null;
    return hlAccountRaw;
  }, [evmAddress, hlPortfolioData?.address, hlAccountRaw]);
  
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chainFilter, setChainFilter] = useState<ChainFilter>("all");
  const [asterBalancePayload, setAsterBalancePayload] = useState<{
    rows: unknown[];
    error: string | null;
    warning: string | null;
    queriedUser: string | null;
  }>({ rows: [], error: null, warning: null, queriedUser: null });
  const [asterPositionPayload, setAsterPositionPayload] = useState<{
    rows: unknown[];
    error: string | null;
  }>({ rows: [], error: null });

  const noWallet = !evmAddress;

  useEffect(() => {
    if (hlPositions.length > 0) {
      const hlPositionsMapped = hlPositions.map(hlPos => {
        const markPrice = hlPos.markPrice || hlPos.entryPrice;
        const sizeUsd = hlPos.size * markPrice;
        
        return {
          id: `hl-${hlPos.coin}`,
          protocol: "hyperliquid" as const,
          chain: "Hyperliquid" as const,
          type: "perp" as const,
          symbol: hlPos.coin,
          baseAsset: hlPos.coin,
          quoteAsset: "USDC",
          side: (hlPos.side === "long" ? "LONG" : "SHORT") as "LONG" | "SHORT",
          leverage: hlPos.leverage,
          sizeBase: hlPos.size,
          sizeUsd: sizeUsd,
          margin: sizeUsd / hlPos.leverage,
          marginUsed: sizeUsd / hlPos.leverage,
          marginRatio: 0,
          entryPrice: hlPos.entryPrice,
          markPrice: markPrice,
          liquidationPrice: hlPos.liquidationPrice || 0,
          liquidationDistance: hlPos.liquidationPrice 
            ? Math.abs((markPrice - hlPos.liquidationPrice) / markPrice) * 100
            : 0,
          unrealizedPnl: hlPos.unrealizedPnl,
          unrealizedPnlPercent: hlPos.returnOnEquity,
          realizedPnl: 0,
          fundingPaid: 0,
          feesPaid: 0,
          totalPnl: hlPos.unrealizedPnl,
          openedAt: Date.now(),
          duration: "Active",
          isCloseable: true,
          closeMethod: "api" as const,
          isAtRisk: false,
          isCritical: false,
        };
      });
      const otherPositions = positions.filter(p => p.protocol !== "hyperliquid");
      setPositions([...otherPositions, ...hlPositionsMapped]);
    } else if (positions.some(p => p.protocol === "hyperliquid")) {
      setPositions(positions.filter(p => p.protocol !== "hyperliquid"));
    }
  }, [hlPositions]);

  const asterMappedPositions = useMemo(
    () => mapAsterPositionRiskRows(asterPositionPayload.rows),
    [asterPositionPayload.rows]
  );

  useEffect(() => {
    const { positions, setPositions } = usePositionStore.getState();
    const asterOk =
      evmAddress &&
      asterBalancePayload.queriedUser &&
      asterBalancePayload.queriedUser.toLowerCase() === evmAddress.toLowerCase();

    if (asterOk && asterMappedPositions.length > 0) {
      setPositions([...positions.filter((p) => p.protocol !== "aster"), ...asterMappedPositions]);
    } else {
      setPositions(positions.filter((p) => p.protocol !== "aster"));
    }
  }, [asterMappedPositions, evmAddress, asterBalancePayload.queriedUser]);

  const asterAccount = useMemo(() => {
    if (
      !evmAddress ||
      !asterBalancePayload.queriedUser ||
      asterBalancePayload.queriedUser.toLowerCase() !== evmAddress.toLowerCase()
    ) {
      return null;
    }

    const rows = asterBalancePayload.rows.filter(
      (x): x is AsterBalRow => x !== null && typeof x === "object"
    );
    if (rows.length === 0) {
      return null;
    }
    const agg = parseAsterBalances(rows);
    if (!agg) {
      return null;
    }
    const locked = Math.max(0, agg.totalEquity - agg.withdrawable);
    return {
      accountValue: agg.totalEquity,
      availableBalance: agg.withdrawable,
      marginUsed: locked,
      asset: agg.primaryAsset,
      error: asterBalancePayload.error,
    };
  }, [asterBalancePayload, evmAddress]);

  const activeWalletRef = useRef<string | null>(null);
  const fetchGenRef = useRef(0);
  activeWalletRef.current = evmAddress ?? null;

  const fetchPortfolio = useCallback(async () => {
    const wallet = evmAddress;
    if (!wallet) {
      setData(null);
      setAsterBalancePayload({ rows: [], error: null, warning: null, queriedUser: null });
      setAsterPositionPayload({ rows: [], error: null });
      setLoading(false);
      return;
    }

    const gen = ++fetchGenRef.current;

    const isObsolete = () =>
      gen !== fetchGenRef.current ||
      activeWalletRef.current?.toLowerCase() !== wallet.toLowerCase();

    setError(null);
    void refetchHl();
    try {
      const uid = encodeURIComponent(wallet);
      const fetchOpts: RequestInit = {
        headers: asterWalletHeaders(wallet),
        cache: "no-store",
      };
      const [balJson, posJson] = await Promise.all([
        fetch(`/api/aster/balance?userId=${uid}`, fetchOpts).then((r) => r.json().catch(() => ({}))),
        fetch(`/api/aster/position-risk?userId=${uid}`, fetchOpts).then((r) => r.json().catch(() => ({}))),
      ]);

      if (isObsolete()) return;

      const apiUser =
        typeof balJson?.user === "string"
          ? balJson.user
          : wallet;

      if (apiUser.toLowerCase() !== wallet.toLowerCase()) {
        if (!isObsolete()) setLoading(false);
        return;
      }

      const balErr = typeof balJson?.error === "string" ? balJson.error : null;
      const posErr = typeof posJson?.error === "string" ? posJson.error : null;
      setAsterBalancePayload({
        rows: Array.isArray(balJson?.balances) ? balJson.balances : [],
        error: balErr,
        warning: typeof balJson?.warning === "string" ? balJson.warning : null,
        queriedUser: apiUser,
      });
      setAsterPositionPayload({
        rows: Array.isArray(posJson?.positions) ? posJson.positions : [],
        error: posErr,
      });
    } catch {
      if (!isObsolete()) {
        setAsterBalancePayload({
          rows: [],
          error: "Failed to load Aster data",
          warning: null,
          queriedUser: null,
        });
        setAsterPositionPayload({ rows: [], error: null });
      }
    }
    if (!isObsolete()) setLoading(false);
  }, [evmAddress, refetchHl]);

  useEffect(() => {
    fetchGenRef.current += 1;
    setData(null);
    setAsterBalancePayload({ rows: [], error: null, warning: null, queriedUser: null });
    setAsterPositionPayload({ rows: [], error: null });
    setError(null);

    if (!evmAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, [evmAddress, fetchPortfolio]);

  const asterWalletMismatch = useMemo(() => {
    if (!evmAddress || !asterBalancePayload.queriedUser) return false;
    return asterBalancePayload.queriedUser.toLowerCase() !== evmAddress.toLowerCase();
  }, [evmAddress, asterBalancePayload.queriedUser]);

  const filteredWalletTokens = useMemo(() => {
    if (!data?.walletTokens) return [];
    
    const baseTokens = chainFilter === "all" ? data.walletTokens : data.walletTokens.filter(t => t.chain === chainFilter);
    
    if (hlAccount && hlAccount.accountValue > 0) {
      const hlToken: WalletToken = {
        asset: "USDC",
        chain: "Hyperliquid",
        amount: hlAccount.accountValue,
        price: 1,
        valueUsd: hlAccount.accountValue,
        change24h: 0,
      };
      
      if (chainFilter === "all" || chainFilter === "Hyperliquid") {
        return [...baseTokens, hlToken];
      }
    }

    if (asterAccount && asterAccount.accountValue > 0) {
      const asterToken: WalletToken = {
        asset: asterAccount.asset,
        chain: "Arbitrum",
        amount: asterAccount.accountValue,
        price: 1,
        valueUsd: asterAccount.accountValue,
        change24h: 0,
      };
      if (chainFilter === "all" || chainFilter === "Arbitrum") {
        return [...baseTokens, asterToken];
      }
    }
    
    return baseTokens;
  }, [data, chainFilter, hlAccount, asterAccount]);

  const filteredDeposits = useMemo(() => {
    if (!data?.deposits) {
      return [];
    }
    
    const baseDeposits = chainFilter === "all" ? data.deposits : data.deposits.filter(d => d.chain === chainFilter);
    
    if (hlAccount && hlAccount.accountValue > 0) {
      const hlDeposit: ProtocolDeposit = {
        protocol: "Hyperliquid",
        chain: "Hyperliquid",
        asset: "USDC",
        totalDeposited: hlAccount.accountValue,
        free: hlAccount.availableBalance,
        locked: hlAccount.marginUsed,
        utilizationPct: hlAccount.accountValue > 0 ? (hlAccount.marginUsed / hlAccount.accountValue) * 100 : 0,
        connected: true,
      };
      
      if (chainFilter === "all" || chainFilter === "Hyperliquid") {
        return [...baseDeposits, hlDeposit];
      }
    }

    if (asterAccount && asterAccount.accountValue > 0) {
      const asterDeposit: ProtocolDeposit = {
        protocol: "Aster",
        chain: "Arbitrum",
        asset: asterAccount.asset,
        totalDeposited: asterAccount.accountValue,
        free: asterAccount.availableBalance,
        locked: asterAccount.marginUsed,
        utilizationPct:
          asterAccount.accountValue > 0
            ? (asterAccount.marginUsed / asterAccount.accountValue) * 100
            : 0,
        connected: true,
      };
      if (chainFilter === "all" || chainFilter === "Arbitrum") {
        return [...baseDeposits, asterDeposit];
      }
    }
    
    return baseDeposits;
  }, [data, chainFilter, hlAccount, asterAccount]);

  const filteredPositions = useMemo(() => {
    if (chainFilter === "all") return positions;
    return positions.filter((p) => p.chain === chainFilter);
  }, [positions, chainFilter]);

  const filteredWalletBalance = useMemo(() =>
    filteredWalletTokens.reduce((s, t) => s + t.valueUsd, 0), [filteredWalletTokens]);

  const filteredProtocolDeposits = useMemo(() =>
    filteredDeposits.reduce((s, d) => s + d.totalDeposited, 0), [filteredDeposits]);

  const filteredFreeMargin = useMemo(() => {
    const depositMargin = filteredDeposits.reduce((s, d) => s + d.free, 0);
    const hlMargin = hlAccount?.availableBalance || 0;
    const asterMargin = asterAccount?.availableBalance || 0;
    return depositMargin + hlMargin + asterMargin;
  }, [filteredDeposits, hlAccount, asterAccount]);

  const filteredUsedCollateral = useMemo(() => {
    const depositCollateral = filteredDeposits.reduce((s, d) => s + d.locked, 0);
    const hlCollateral = hlAccount?.marginUsed || 0;
    const asterCollateral = asterAccount?.marginUsed || 0;
    return depositCollateral + hlCollateral + asterCollateral;
  }, [filteredDeposits, hlAccount, asterAccount]);

  const unrealizedPnl = useMemo(() => {
    return filteredPositions.reduce((s, p) => {
      const pnl = typeof p.unrealizedPnl === 'number' ? p.unrealizedPnl : 0;
      return s + pnl;
    }, 0);
  }, [filteredPositions]);

  const filteredTotalNetWorth = useMemo(() => {
    const baseNetWorth = filteredWalletBalance + filteredProtocolDeposits;
    const hlNetWorth = hlAccount?.accountValue || 0;
    const asterNetWorth = asterAccount?.accountValue || 0;
    return baseNetWorth + hlNetWorth + asterNetWorth;
  }, [filteredWalletBalance, filteredProtocolDeposits, hlAccount, asterAccount]);

  const filteredAvailableFunds = useMemo(() =>
    filteredWalletBalance + filteredFreeMargin, [filteredWalletBalance, filteredFreeMargin]);

  const totalPnl = unrealizedPnl;

  const hlEquity = hlAccount?.accountValue ?? 0;
  const asterEquity = asterAccount?.accountValue ?? 0;
  const onChainWallet = data?.walletBalance ?? 0;

  const totalNetWorthAll =
    chainFilter === "all"
      ? onChainWallet + hlEquity + asterEquity
      : filteredTotalNetWorth;

  const hlSettled = !hlLoading;
  const asterSettled = !loading || asterBalancePayload.queriedUser !== null;
  const balancesLoading = !!evmAddress && !hlSettled && !asterSettled;

  return {
    data,
    loading,
    hlLoading,
    balancesLoading,
    error,
    noWallet,
    evmAddress,
    chainFilter,
    setChainFilter,
    fetchPortfolio,
    hlEquity,
    asterEquity,
    asterWarning: asterBalancePayload.warning,
    asterLoadError: asterBalancePayload.error,
    asterQueriedUser: asterBalancePayload.queriedUser,
    asterWalletMismatch,

    walletBalance: chainFilter === "all" ? onChainWallet : filteredWalletBalance,
    protocolDeposits: chainFilter === "all" ? (data?.protocolDeposits ?? 0) : filteredProtocolDeposits,
    freeMargin: chainFilter === "all"
      ? (data?.freeMargin ?? 0) + (hlAccount?.availableBalance || 0) + (asterAccount?.availableBalance || 0)
      : filteredFreeMargin,
    usedCollateral: chainFilter === "all"
      ? (data?.usedCollateral ?? 0) + (hlAccount?.marginUsed || 0) + (asterAccount?.marginUsed || 0)
      : filteredUsedCollateral,
    totalNetWorth: totalNetWorthAll,
    availableFunds: chainFilter === "all"
      ? (data?.availableFunds ?? 0) + (hlAccount?.availableBalance || 0) + (asterAccount?.availableBalance || 0)
      : filteredAvailableFunds,

    walletTokens: filteredWalletTokens,
    deposits: filteredDeposits,
    positions: filteredPositions,
    perpPositionCount: filteredPositions.length,
    unrealizedPnl,
    totalPnl,
  };
}
