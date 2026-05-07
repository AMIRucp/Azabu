export type TxState = "idle" | "signing" | "success" | "error" | "setup" | "bridging";

export interface TxCallbacks {
  setTxState: (s: TxState) => void;
  setTxMsg: (m: string) => void;
  setTxSig: (s: string | null) => void;
}

export interface MarketInfo {
  sym: string;
  price: number;
  maxLev: number;
  marketName?: string;
  category?: string;
}

interface BaseTradeParams {
  market: MarketInfo;
  side: "long" | "short";
  sizeNum: number;
  posValue: number;
  lev: number;
  otype: "market" | "limit" | "stop";
  price: string;
  maxLev: number;
  marketSymbol: string;
  onTradeSuccess?: () => void;
}

export interface AsterTradeParams extends BaseTradeParams {
  asterUserId: string | undefined;
  walletAddress?: string;
  hiddenOrder: boolean;
  tp: string;
  sl: string;
  collateral: number;
}

export interface HyperliquidTradeParams extends BaseTradeParams {
  evmAddress: string;
  assetId?: number;
}

export function recordTradeToDb(data: {
  wallet: string; protocol: string; chain: string; market: string;
  side: string; sizeUsd: number; entryPrice?: number; leverage?: number; txSignature: string;
}) {
  fetch("/api/trades/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).catch(() => {});
}
