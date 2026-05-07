import { useState, useEffect, useCallback, useRef } from "react";
import { useHyperliquidWebSocket } from "./useHyperliquidWebSocket";

export interface HyperliquidPosition {
  coin: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  leverage: number;
  unrealizedPnl: number;
  returnOnEquity: number;
  liquidationPrice: number | null;
  marginType: string;
  markPrice?: number;
  rawPosition: any;
}

export interface HyperliquidOrder {
  orderId: number;
  coin: string;
  side: string;
  price: number;
  size: number;
  filled: number;
  orderType: string;
  timestamp?: number;
  rawOrder: any;
}

export interface HyperliquidAccount {
  accountValue: number;
  availableBalance: number;
  marginUsed: number;
  positionValue: number;
  rawUsd: number;
}

export interface HyperliquidPortfolio {
  success: boolean;
  address: string;
  account: HyperliquidAccount;
  positions: HyperliquidPosition[];
  openOrders: HyperliquidOrder[];
  timestamp: number;
}

interface UseHyperliquidPortfolioOptions {
  address?: string;
  enabled?: boolean;
  pollInterval?: number;
}

export function useHyperliquidPortfolio({
  address,
  enabled = true,
  pollInterval = 15000,
}: UseHyperliquidPortfolioOptions = {}) {
  const [data, setData] = useState<HyperliquidPortfolio | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { prices: wsPrices, isConnected: wsConnected } = useHyperliquidWebSocket({
    address,
    enabled,
  });

  // Keep wsPrices in a ref so fetchPortfolio doesn't need it as a dependency
  const wsPricesRef = useRef(wsPrices);
  useEffect(() => {
    wsPricesRef.current = wsPrices;
  }, [wsPrices]);

  const fetchPortfolio = useCallback(async () => {
    if (!address || !enabled) return;

    setError(null);

    try {
      const res = await fetch(`/api/portfolio/hyperliquid?address=${address}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to fetch portfolio");
        // Don't clear data on error - keep showing existing data
        return;
      }

      if (json.success) {
        const prices = wsPricesRef.current;
        const updatedPositions = json.positions.map((pos: HyperliquidPosition) => {
          const livePrice = prices[pos.coin];
          if (livePrice && livePrice > 0) {
            const priceDiff = livePrice - pos.entryPrice;
            const newUnrealizedPnl = priceDiff * pos.size * (pos.side === "long" ? 1 : -1);
            const positionValue = pos.size * livePrice;
            const margin = positionValue / pos.leverage;
            const newRoe = margin > 0 ? (newUnrealizedPnl / margin) * 100 : 0;
            return { ...pos, markPrice: livePrice, unrealizedPnl: newUnrealizedPnl, returnOnEquity: newRoe };
          }
          return pos;
        });

        setData({ ...json, positions: updatedPositions });
      } else {
        setError(json.error || "Unknown error");
        // Don't clear data on error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      // Don't clear data on network error - keep showing existing data
    } finally {
      setIsLoading(false);
    }
  }, [address, enabled]); // removed wsPrices from deps - use ref instead

  useEffect(() => {
    if (!address || !enabled) {
      setData(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    fetchPortfolio();

    if (pollInterval > 0) {
      const interval = setInterval(fetchPortfolio, pollInterval);
      return () => clearInterval(interval);
    }
  }, [address, enabled, pollInterval, fetchPortfolio]);

  return {
    data,
    account: data?.account || null,
    positions: data?.positions || [],
    openOrders: data?.openOrders || [],
    isLoading,
    error,
    refetch: fetchPortfolio,
    wsConnected,
    livePrices: wsPrices,
  };
}
