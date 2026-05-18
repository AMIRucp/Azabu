"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useEvmWallet } from "./useEvmWallet";
import usePositionStore, { type UnifiedPosition } from "@/stores/usePositionStore";
import { useHyperliquidPortfolio } from "./useHyperliquidPortfolio";
import { asterWalletHeaders } from "@/lib/asterClientHeaders";
import { parseAsterBalances, type AsterBalRow } from "@/lib/asterBalanceParse";
import { coerceAsterPositionRiskRows } from "@/lib/asterPositionRiskFilter";
import {
  mapAsterPositionRiskRows,
  mergeAsterPositionsIntoStore,
} from "@/lib/asterPositionMap";

function extractAsterPositionsFromApiBody(body: unknown): unknown[] {
  if (!body || typeof body !== "object") return [];
  const o = body as Record<string, unknown>;
  if (Array.isArray(o.positions)) return o.positions;
  const coerced = coerceAsterPositionRiskRows(o);
  return coerced ?? [];
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

  const hlDataMatchesWallet = useMemo(() => {
    if (!evmAddress) return false;
    const respAddr = hlPortfolioData?.address;
    if (!respAddr) return false;
    return respAddr.toLowerCase() === evmAddress.toLowerCase();
  }, [evmAddress, hlPortfolioData?.address]);

  const hlPositionsScoped = useMemo(() => {
    if (!hlDataMatchesWallet) return [];
    return hlPositions;
  }, [hlDataMatchesWallet, hlPositions]);

  const hlAccount = useMemo(() => {
    if (!hlDataMatchesWallet) return null;
    return hlAccountRaw;
  }, [hlDataMatchesWallet, hlAccountRaw]);
  
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
    queriedUser: string | null;
  }>({ rows: [], error: null, queriedUser: null });

  const noWallet = !evmAddress;

  useEffect(() => {
    if (!evmAddress || !hlDataMatchesWallet) {
      const { positions, setPositions } = usePositionStore.getState();
      if (positions.some((p) => p.protocol === "hyperliquid")) {
        setPositions(positions.filter((p) => p.protocol !== "hyperliquid"));
      }
      return;
    }
    const { positions, setPositions } = usePositionStore.getState();
    if (hlPositionsScoped.length > 0) {
      const hlPositionsMapped = hlPositionsScoped.map(hlPos => {
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
      const asterKeep = positions.filter((p) => p.protocol === "aster");
      const otherPositions = positions.filter(
        (p) => p.protocol !== "hyperliquid" && p.protocol !== "aster"
      );
      setPositions([...otherPositions, ...asterKeep, ...hlPositionsMapped]);
    } else if (positions.some((p) => p.protocol === "hyperliquid")) {
      setPositions(positions.filter((p) => p.protocol !== "hyperliquid"));
    }
  }, [hlPositionsScoped, evmAddress, hlDataMatchesWallet]);

  const asterMappedPositions = useMemo(
    () => mapAsterPositionRiskRows(asterPositionPayload.rows),
    [asterPositionPayload.rows]
  );

  useEffect(() => {
    if (!evmAddress) return;
    const { positions, setPositions } = usePositionStore.getState();
    const posOk =
      !!asterPositionPayload.queriedUser &&
      asterPositionPayload.queriedUser.toLowerCase() === evmAddress.toLowerCase();

    const hlKeep = hlDataMatchesWallet
      ? positions.filter((p) => p.protocol === "hyperliquid")
      : [];
    const otherKeep = positions.filter(
      (p) => p.protocol !== "aster" && p.protocol !== "hyperliquid"
    );

    if (posOk) {
      setPositions([...otherKeep, ...hlKeep, ...asterMappedPositions]);
    } else {
      setPositions([...otherKeep, ...hlKeep]);
    }
  }, [
    asterMappedPositions,
    evmAddress,
    asterPositionPayload.queriedUser,
    hlDataMatchesWallet,
  ]);

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
  const inFlightAbortRef = useRef<AbortController | null>(null);
  activeWalletRef.current = evmAddress ?? null;

  const fetchPortfolio = useCallback(async () => {
    const wallet = evmAddress;
    if (!wallet) {
      inFlightAbortRef.current?.abort();
      inFlightAbortRef.current = null;
      setData(null);
      setAsterBalancePayload({ rows: [], error: null, warning: null, queriedUser: null });
      setAsterPositionPayload({ rows: [], error: null, queriedUser: null });
      setLoading(false);
      return;
    }

    inFlightAbortRef.current?.abort();
    const ac = new AbortController();
    inFlightAbortRef.current = ac;

    const gen = ++fetchGenRef.current;

    const isObsolete = () =>
      ac.signal.aborted ||
      gen !== fetchGenRef.current ||
      activeWalletRef.current?.toLowerCase() !== wallet.toLowerCase();

    setError(null);
    void refetchHl();
    try {
      const fetchOpts: RequestInit = {
        headers: asterWalletHeaders(wallet),
        cache: "no-store",
        signal: ac.signal,
      };
      const cv = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
      const walletParam = `&w=${encodeURIComponent(wallet)}`;
      const [balJson, posJson] = await Promise.all([
        fetch(`/api/aster/balance?cv=${encodeURIComponent(cv)}${walletParam}`, fetchOpts).then((r) => r.json().catch(() => ({}))),
        fetch(`/api/aster/position-risk?cv=${encodeURIComponent(cv)}${walletParam}`, fetchOpts).then((r) => r.json().catch(() => ({}))),
      ]);

      if (isObsolete()) return;

      const balApiUser =
        typeof balJson?.user === "string" ? (balJson.user as string) : wallet;
      const balErr = typeof balJson?.error === "string" ? balJson.error : null;
      const balWalletOk = balApiUser.toLowerCase() === wallet.toLowerCase();

      const posApiUser =
        typeof posJson?.user === "string" ? (posJson.user as string) : wallet;
      const posErr = typeof posJson?.error === "string" ? posJson.error : null;
      const rawPosRows = extractAsterPositionsFromApiBody(posJson);
      const posWalletOk = posApiUser.toLowerCase() === wallet.toLowerCase();

      setAsterBalancePayload({
        rows: balWalletOk && Array.isArray(balJson?.balances) ? balJson.balances : [],
        error: balWalletOk
          ? balErr
          : balErr || "Could not verify account for the connected wallet.",
        warning: balWalletOk && typeof balJson?.warning === "string" ? balJson.warning : null,
        queriedUser: balWalletOk ? balApiUser : null,
      });

      setAsterPositionPayload({
        rows: posWalletOk ? rawPosRows : [],
        error: posWalletOk
          ? posErr
          : posErr || "Could not verify positions for the connected wallet.",
        queriedUser: posWalletOk ? posApiUser : null,
      });

      if (posWalletOk && !isObsolete()) {
        const mappedFromApi = Array.isArray((posJson as { mappedPositions?: unknown }).mappedPositions)
          ? ((posJson as { mappedPositions: UnifiedPosition[] }).mappedPositions)
          : null;
        if (mappedFromApi && mappedFromApi.length > 0) {
          const current = usePositionStore.getState().positions;
          usePositionStore.getState().setPositions([
            ...current.filter((p) => p.protocol !== "aster"),
            ...mappedFromApi,
          ]);
        } else {
          mergeAsterPositionsIntoStore(rawPosRows);
        }
      }
    } catch {
      if (!isObsolete()) {
        setAsterBalancePayload({
          rows: [],
          error: "Could not load account data. Please try again.",
          warning: null,
          queriedUser: null,
        });
        setAsterPositionPayload({ rows: [], error: null, queriedUser: null });
      }
    }
    if (!isObsolete()) setLoading(false);
  }, [evmAddress, refetchHl]);

  useEffect(() => {
    inFlightAbortRef.current?.abort();
    inFlightAbortRef.current = null;
    fetchGenRef.current += 1;
    setData(null);
    setAsterBalancePayload({ rows: [], error: null, warning: null, queriedUser: null });
    setAsterPositionPayload({ rows: [], error: null, queriedUser: null });
    setError(null);
    usePositionStore.getState().setPositions([]);

    if (!evmAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void refetchHl();
    void fetchPortfolio();
    const interval = setInterval(() => {
      void refetchHl();
      void fetchPortfolio();
    }, 30000);
    return () => {
      clearInterval(interval);
      inFlightAbortRef.current?.abort();
      inFlightAbortRef.current = null;
    };
  }, [evmAddress, fetchPortfolio, refetchHl]);

  const asterWalletMismatch = useMemo(() => {
    if (!evmAddress || !asterBalancePayload.queriedUser) return false;
    return asterBalancePayload.queriedUser.toLowerCase() !== evmAddress.toLowerCase();
  }, [evmAddress, asterBalancePayload.queriedUser]);

  const asterPositionHint = useMemo<string | null>(() => null, []);

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
    asterPositionLoadError: asterPositionPayload.error,
    asterPositionHint,
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
