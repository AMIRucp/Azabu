"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useEvmWallet } from "./useEvmWallet";
import usePositionStore from "@/stores/usePositionStore";

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

export type ChainFilter = "all" | "Arbitrum" | "Ethereum";

export function usePortfolioData() {
  const { evmAddress } = useEvmWallet();
  const walletAddress = evmAddress;
  const positions = usePositionStore((s) => s.positions);
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chainFilter, setChainFilter] = useState<ChainFilter>("all");

  const noWallet = !evmAddress;

  const fetchPortfolio = useCallback(async () => {
    if (!evmAddress) {
      setData(null);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const params = new URLSearchParams();
      if (evmAddress) params.set("evm", evmAddress);
      const res = await fetch(`/api/portfolio?${params}`);
      if (!res.ok) throw new Error("Failed to load portfolio");
      const d: PortfolioData = await res.json();
      setData(d);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
    setLoading(false);
  }, [evmAddress]);

  useEffect(() => {
    setLoading(true);
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  const filteredWalletTokens = useMemo(() => {
    if (!data?.walletTokens) return [];
    if (chainFilter === "all") return data.walletTokens;
    return data.walletTokens.filter(t => t.chain === chainFilter);
  }, [data, chainFilter]);

  const filteredDeposits = useMemo(() => {
    if (!data?.deposits) return [];
    if (chainFilter === "all") return data.deposits;
    return data.deposits.filter(d => d.chain === chainFilter);
  }, [data, chainFilter]);

  const filteredPositions = useMemo(() => {
    if (chainFilter === "all") return positions;
    return positions.filter(p => p.chain === chainFilter);
  }, [positions, chainFilter]);

  const filteredWalletBalance = useMemo(() =>
    filteredWalletTokens.reduce((s, t) => s + t.valueUsd, 0), [filteredWalletTokens]);

  const filteredProtocolDeposits = useMemo(() =>
    filteredDeposits.reduce((s, d) => s + d.totalDeposited, 0), [filteredDeposits]);

  const filteredFreeMargin = useMemo(() =>
    filteredDeposits.reduce((s, d) => s + d.free, 0), [filteredDeposits]);

  const filteredUsedCollateral = useMemo(() =>
    filteredDeposits.reduce((s, d) => s + d.locked, 0), [filteredDeposits]);

  const unrealizedPnl = useMemo(() =>
    filteredPositions.reduce((s, p) => s + p.unrealizedPnl, 0), [filteredPositions]);

  const filteredTotalNetWorth = useMemo(() =>
    filteredWalletBalance + filteredProtocolDeposits, [filteredWalletBalance, filteredProtocolDeposits]);

  const filteredAvailableFunds = useMemo(() =>
    filteredWalletBalance + filteredFreeMargin, [filteredWalletBalance, filteredFreeMargin]);

  const totalPnl = unrealizedPnl;

  return {
    data,
    loading,
    error,
    noWallet,
    chainFilter,
    setChainFilter,
    fetchPortfolio,

    walletBalance: chainFilter === "all" ? (data?.walletBalance ?? 0) : filteredWalletBalance,
    protocolDeposits: chainFilter === "all" ? (data?.protocolDeposits ?? 0) : filteredProtocolDeposits,
    freeMargin: chainFilter === "all" ? (data?.freeMargin ?? 0) : filteredFreeMargin,
    usedCollateral: chainFilter === "all" ? (data?.usedCollateral ?? 0) : filteredUsedCollateral,
    totalNetWorth: chainFilter === "all" ? (data?.totalNetWorth ?? 0) : filteredTotalNetWorth,
    availableFunds: chainFilter === "all" ? (data?.availableFunds ?? 0) : filteredAvailableFunds,

    walletTokens: filteredWalletTokens,
    deposits: filteredDeposits,
    positions: filteredPositions,
    perpPositionCount: filteredPositions.length,
    unrealizedPnl,
    totalPnl,
  };
}
