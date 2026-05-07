"use client";

import { useCallback, useRef, useState } from "react";
import { executeAsterTrade, retryAsterTpSl } from "./executors/executeAsterTrade";
import { executeHyperliquidTrade } from "./executors/executeHyperliquidTrade";
import { executeLighterTrade } from "./executors/executeLighterTrade";
import type { TpSlRetryParams } from "./executors/executeAsterTrade";
import { useEvmWallet } from "./useEvmWallet";
import type { TxState } from "./executors/shared";
export type { TxState } from "./executors/shared";

type ChainType = "arbitrum" | "hyperliquid" | "lighter";

interface TradeParams {
  chain: ChainType;
  market: { sym: string; price: number; maxLev: number; marketName?: string; category?: string; protocol?: string };
  side: "long" | "short";
  sizeNum: number;
  posValue: number;
  lev: number;
  otype: "market" | "limit" | "stop";
  price: string;
  maxLev: number;
  marketSymbol: string;
  collateral: number;
  tp: string;
  sl: string;
  hiddenOrder: boolean;
  asterUserId?: string;
  pairId?: number;
  assetId?: number;
  onTradeSuccess?: () => void;
}

export function useTradeExecution() {
  const { evmAddress, isEvmConnected } = useEvmWallet();

  const [txState, setTxState] = useState<TxState>("idle");
  const [txMsg, setTxMsg] = useState("");
  const [txSig, setTxSig] = useState<string | null>(null);
  const pendingTpSlRetry = useRef<TpSlRetryParams | null>(null);

  const callbacks = { setTxState, setTxMsg, setTxSig };

  const executeTrade = useCallback(async (params: TradeParams) => {
    const { market, side, sizeNum, posValue, lev, otype, price, maxLev, marketSymbol, collateral, tp, sl, hiddenOrder, asterUserId, assetId, onTradeSuccess } = params;

    const isAsterMarket = marketSymbol?.endsWith("USDT") || market.marketName?.endsWith("USDT");
    const isLighterMarket = params.chain === "lighter" || market.protocol === "lighter";

    if (isLighterMarket) {
      await executeLighterTrade(
        { market, side, sizeNum, posValue, lev, otype, price, maxLev, marketSymbol, tp, sl, evmAddress: evmAddress || undefined, onTradeSuccess },
        callbacks,
      );
    } else if (params.chain === "hyperliquid") {
      if (!evmAddress) {
        setTxMsg("Connect your EVM wallet to trade on Hyperliquid");
        setTxState("error");
        return;
      }
      await executeHyperliquidTrade(
        { market, side, sizeNum, posValue, lev, otype, price, maxLev, marketSymbol, evmAddress, assetId, onTradeSuccess },
        callbacks,
      );
    } else if (isAsterMarket) {
      const failedTpSl = await executeAsterTrade(
        { market, side, sizeNum, posValue, lev, otype, price, maxLev, marketSymbol, asterUserId, walletAddress: evmAddress || undefined, hiddenOrder, tp, sl, collateral, onTradeSuccess },
        callbacks,
      );
      if (failedTpSl) {
        pendingTpSlRetry.current = failedTpSl;
      }
    } else {
      setTxMsg(`Trading not supported on this chain`);
      setTxState("error");
    }
  }, [evmAddress, isEvmConnected]);

  const execute = useCallback(async (params: TradeParams) => {
    pendingTpSlRetry.current = null;

    if (!params.sizeNum || params.sizeNum <= 0 || params.market.price <= 0) {
      setTxMsg("Enter a valid size");
      setTxState("error");
      return;
    }

    await executeTrade(params);
  }, [executeTrade]);

  const retryTpSl = useCallback(async () => {
    const params = pendingTpSlRetry.current;
    if (!params) return;
    const success = await retryAsterTpSl(params, callbacks);
    if (success) {
      pendingTpSlRetry.current = null;
    }
  }, []);

  const canRetryTpSl = txState === "setup" && pendingTpSlRetry.current !== null;

  const dismiss = useCallback(() => {
    setTxState("idle");
    setTxMsg("");
    setTxSig(null);
    pendingTpSlRetry.current = null;
  }, []);

  return {
    txState, txMsg, txSig, execute, dismiss, setTxState, setTxMsg, retryTpSl, canRetryTpSl,
  };
}
