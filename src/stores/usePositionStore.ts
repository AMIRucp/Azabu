"use client";

import { create } from "zustand";

export interface UnifiedPosition {
  id: string;
  protocol: string;
  chain: string;
  type: "perp";

  symbol: string;
  baseAsset: string;
  quoteAsset: string;

  side: "LONG" | "SHORT";
  leverage: number;
  sizeBase: number;
  sizeUsd: number;
  margin: number;
  marginUsed: number;
  marginRatio: number;

  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  liquidationDistance: number;

  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  realizedPnl: number;
  fundingPaid: number;
  feesPaid: number;
  totalPnl: number;

  openedAt: number;
  duration: string;

  isCloseable: boolean;
  closeMethod: "phantom" | "api";
  isAtRisk: boolean;
  isCritical: boolean;
}

interface PositionStoreState {
  positions: UnifiedPosition[];
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;

  totalUnrealizedPnl: number;
  totalMarginUsed: number;
  totalPositionValue: number;
  positionCount: number;
  atRiskCount: number;

  setPositions: (positions: UnifiedPosition[]) => void;
  updatePosition: (id: string, updates: Partial<UnifiedPosition>) => void;
  removePosition: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshToken: number;
  refresh: () => void;
}

function computeTotals(positions: UnifiedPosition[]) {
  return {
    totalUnrealizedPnl: positions.reduce((s, p) => s + p.unrealizedPnl, 0),
    totalMarginUsed: positions.reduce((s, p) => s + p.margin, 0),
    totalPositionValue: positions.reduce((s, p) => s + p.sizeUsd, 0),
    positionCount: positions.length,
    atRiskCount: positions.filter((p) => p.isAtRisk).length,
  };
}

const usePositionStore = create<PositionStoreState>((set) => ({
  positions: [],
  lastUpdated: 0,
  isLoading: false,
  error: null,
  totalUnrealizedPnl: 0,
  totalMarginUsed: 0,
  totalPositionValue: 0,
  positionCount: 0,
  atRiskCount: 0,

  setPositions: (positions) =>
    set({
      positions,
      lastUpdated: Date.now(),
      error: null,
      ...computeTotals(positions),
    }),

  updatePosition: (id, updates) =>
    set((state) => {
      const positions = state.positions.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      return { positions, ...computeTotals(positions) };
    }),

  removePosition: (id) =>
    set((state) => {
      const positions = state.positions.filter((p) => p.id !== id);
      return { positions, ...computeTotals(positions) };
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  refreshToken: 0,
  refresh: () => set((s) => ({ refreshToken: s.refreshToken + 1 })),
}));

export default usePositionStore;
