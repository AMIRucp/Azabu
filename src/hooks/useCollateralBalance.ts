"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getCollateralRequirement, type TradeChain } from "@/config/collateralConfig";
import { useEvmWallet } from "./useEvmWallet";

interface CollateralState {
  balance: number | null;
  loading: boolean;
  token: string;
  chainLabel: string;
  sufficient: boolean;
  deficit: number;
  refresh: () => void;
  arbitrumBalance: number | null;
  hyperliquidBalance: number | null;
  bridgeNeeded: boolean;
  bridgeAmount: number;
  evmConnected: boolean;
  bestSrcChain: string | null;
}

export function useCollateralBalance(chain: TradeChain, requiredAmount: number): CollateralState {
  const { evmAddress, isEvmConnected } = useEvmWallet();
  const [balances, setBalances] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [bestSrcChain, setBestSrcChain] = useState<string | null>(null);
  const fetchRef = useRef(0);

  const requirement = getCollateralRequirement(chain);

  const fetchBalances = useCallback(async () => {
    if (!evmAddress) {
      setBalances(null);
      return;
    }

    const id = ++fetchRef.current;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("arbitrum", evmAddress);

      const res = await fetch(`/api/balances?${params}`);
      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      if (id === fetchRef.current) {
        setBalances(data.balances);
      }
    } catch {
      if (id === fetchRef.current) {
        setBalances(null);
      }
    } finally {
      if (id === fetchRef.current) {
        setLoading(false);
      }
    }
  }, [chain, evmAddress]);

  const fetchMultichain = useCallback(async () => {
    if (!evmAddress) { setBestSrcChain(null); return; }
    try {
      const res = await fetch(`/api/balances/multichain?address=${evmAddress}`);
      if (!res.ok) return;
      const data = await res.json();
      setBestSrcChain(data.bestSrcChain ?? null);
    } catch {
      setBestSrcChain(null);
    }
  }, [evmAddress]);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  useEffect(() => {
    fetchMultichain();
    const interval = setInterval(fetchMultichain, 60000);
    return () => clearInterval(interval);
  }, [fetchMultichain]);

  const primaryBalance = balances ? (balances[requirement.balanceKey] ?? 0) : null;
  const arbitrumBalance = balances ? (balances.arbitrumUsdt ?? 0) : null;
  const hyperliquidBalance = balances ? (balances.hyperliquid ?? 0) : null;

  const primaryBal = primaryBalance ?? 0;
  const requiredWithBuffer = requiredAmount * 1.02;

  const sufficient = primaryBalance !== null ? primaryBal >= requiredWithBuffer : true;
  const deficit = sufficient ? 0 : requiredWithBuffer - primaryBal;
  const bridgeNeeded = primaryBalance !== null && requiredAmount > 0 && primaryBal < requiredWithBuffer;
  const bridgeAmount = bridgeNeeded ? deficit : 0;

  return {
    balance: primaryBalance,
    loading,
    token: requirement.token,
    chainLabel: requirement.chainLabel,
    sufficient,
    deficit,
    refresh: fetchBalances,
    arbitrumBalance,
    hyperliquidBalance,
    bridgeNeeded,
    bridgeAmount,
    evmConnected: isEvmConnected,
    bestSrcChain,
  };
}
