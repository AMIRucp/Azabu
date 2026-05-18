import { useState, useEffect, useCallback, useRef } from "react";
import { useHyperliquidWebSocket } from "./useHyperliquidWebSocket";
import { toUserFacingError } from "@/lib/userFacingErrors";

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

  const wsPricesRef = useRef(wsPrices);
  const fetchGenRef = useRef(0);
  useEffect(() => {
    wsPricesRef.current = wsPrices;
  }, [wsPrices]);

  const fetchPortfolio = useCallback(async () => {
    if (!address || !enabled) return;

    const fetchFor = address;
    const gen = ++fetchGenRef.current;
    setError(null);

    const isObsolete = () =>
      gen !== fetchGenRef.current ||
      fetchFor.toLowerCase() !== (address ?? "").toLowerCase();

    try {
      const uid = encodeURIComponent(fetchFor);
      const cv =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now());
      const res = await fetch(
        `/api/portfolio/hyperliquid?address=${uid}&cv=${encodeURIComponent(cv)}`,
        { cache: "no-store" }
      );
      const json = await res.json();

      if (isObsolete()) return;

      if (!res.ok) {
        setError(toUserFacingError(json.error || "Failed to fetch portfolio", "portfolio"));
        return;
      }

      if (json.success) {
        const respAddr = typeof json.address === "string" ? json.address : "";
        if (respAddr.toLowerCase() !== fetchFor.toLowerCase()) {
          return;
        }

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

        if (!isObsolete()) {
          setData({ ...json, positions: updatedPositions });
        }
      } else {
        setError(toUserFacingError(json.error || "Unknown error", "portfolio"));
      }
    } catch (err) {
      if (!isObsolete()) {
        setError(toUserFacingError(err, "portfolio"));
      }
    } finally {
      if (!isObsolete()) setIsLoading(false);
    }
  }, [address, enabled]);

  useEffect(() => {
    if (!address || !enabled) {
      setData(null);
      setError(null);
      return;
    }

    fetchGenRef.current += 1;
    setData(null);
    setError(null);
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
