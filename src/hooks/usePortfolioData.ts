"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useEvmWallet } from "./useEvmWallet";
import usePositionStore from "@/stores/usePositionStore";
import { useHyperliquidPortfolio } from "./useHyperliquidPortfolio";

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
  const { account: hlAccount, positions: hlPositions } = useHyperliquidPortfolio({
    address: evmAddress || undefined,
    enabled: !!evmAddress,
    pollInterval: 30000,
  });
  
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chainFilter, setChainFilter] = useState<ChainFilter>("all");

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

  const fetchPortfolio = useCallback(async () => {
    if (!evmAddress) {
      setData(null);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("evm", evmAddress);
      const res = await fetch(`/api/portfolio?${params}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const d: PortfolioData = await res.json();
      setData(d);
    } catch {
      // keep existing data on network error
    }
    setLoading(false);
  }, [evmAddress]);

  useEffect(() => {
    if (!data) setLoading(true);
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

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
    
    return baseTokens;
  }, [data, chainFilter, hlAccount]);

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
    
    return baseDeposits;
  }, [data, chainFilter, hlAccount]);

  const filteredPositions = useMemo(() => {
    const allPositions = [...positions, ...hlPositions.map(hlPos => ({
      id: `hl-${hlPos.coin}`,
      protocol: "hyperliquid" as const,
      chain: "Hyperliquid" as const,
      symbol: hlPos.coin,
      side: hlPos.side,
      size: hlPos.size,
      entryPrice: hlPos.entryPrice,
      markPrice: hlPos.entryPrice,
      leverage: hlPos.leverage,
      unrealizedPnl: hlPos.unrealizedPnl,
      liquidationPrice: hlPos.liquidationPrice || undefined,
      marginType: hlPos.marginType,
    }))];
    
    if (chainFilter === "all") return allPositions;
    return allPositions.filter(p => p.chain === chainFilter);
  }, [positions, hlPositions, chainFilter]);

  const filteredWalletBalance = useMemo(() =>
    filteredWalletTokens.reduce((s, t) => s + t.valueUsd, 0), [filteredWalletTokens]);

  const filteredProtocolDeposits = useMemo(() =>
    filteredDeposits.reduce((s, d) => s + d.totalDeposited, 0), [filteredDeposits]);

  const filteredFreeMargin = useMemo(() => {
    const depositMargin = filteredDeposits.reduce((s, d) => s + d.free, 0);
    const hlMargin = hlAccount?.availableBalance || 0;
    return depositMargin + hlMargin;
  }, [filteredDeposits, hlAccount]);

  const filteredUsedCollateral = useMemo(() => {
    const depositCollateral = filteredDeposits.reduce((s, d) => s + d.locked, 0);
    const hlCollateral = hlAccount?.marginUsed || 0;
    return depositCollateral + hlCollateral;
  }, [filteredDeposits, hlAccount]);

  const unrealizedPnl = useMemo(() => {
    return filteredPositions.reduce((s, p) => {
      const pnl = typeof p.unrealizedPnl === 'number' ? p.unrealizedPnl : 0;
      return s + pnl;
    }, 0);
  }, [filteredPositions]);

  const filteredTotalNetWorth = useMemo(() => {
    const baseNetWorth = filteredWalletBalance + filteredProtocolDeposits;
    const hlNetWorth = hlAccount?.accountValue || 0;
    return baseNetWorth + hlNetWorth;
  }, [filteredWalletBalance, filteredProtocolDeposits, hlAccount]);

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
    freeMargin: chainFilter === "all" ? ((data?.freeMargin ?? 0) + (hlAccount?.availableBalance || 0)) : filteredFreeMargin,
    usedCollateral: chainFilter === "all" ? ((data?.usedCollateral ?? 0) + (hlAccount?.marginUsed || 0)) : filteredUsedCollateral,
    totalNetWorth: chainFilter === "all" ? ((data?.totalNetWorth ?? 0) + (hlAccount?.accountValue || 0)) : filteredTotalNetWorth,
    availableFunds: chainFilter === "all" ? ((data?.availableFunds ?? 0) + (hlAccount?.availableBalance || 0)) : filteredAvailableFunds,

    walletTokens: filteredWalletTokens,
    deposits: filteredDeposits,
    positions: filteredPositions,
    perpPositionCount: filteredPositions.length,
    unrealizedPnl,
    totalPnl,
  };
}
