import { create } from 'zustand';

export interface Trade {
  id: string;
  timestamp: number;
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  price: number;
  leverage: number;
  chain: string;
  protocol: string;
  user: string;
  type: 'open' | 'close';
  pnl?: number;
}

export interface Liquidation {
  id: string;
  timestamp: number;
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  price: number;
  leverage: number;
  chain: string;
  protocol: string;
  user: string;
}

interface ActivityStore {
  trades: Trade[];
  liquidations: Liquidation[];
  isConnected: boolean;
  bigLiqAlert: Liquidation | null;

  addTrade: (trade: Trade) => void;
  addLiquidation: (liq: Liquidation) => void;
  setConnected: (v: boolean) => void;
  clearBigLiqAlert: () => void;
}

const useActivityStore = create<ActivityStore>((set, get) => ({
  trades: [],
  liquidations: [],
  isConnected: false,
  bigLiqAlert: null,

  addTrade: (trade) => set({
    trades: [trade, ...get().trades].slice(0, 200),
  }),

  addLiquidation: (liq) => set({
    liquidations: [liq, ...get().liquidations].slice(0, 100),
    bigLiqAlert: liq.size >= 500000 ? liq : get().bigLiqAlert,
  }),

  setConnected: (v) => set({ isConnected: v }),
  clearBigLiqAlert: () => set({ bigLiqAlert: null }),
}));

export default useActivityStore;
