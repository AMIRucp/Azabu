import { recordTrade } from "@/services/xpService";
import { checkTradeAchievements } from "@/services/achievements";
import { asterWalletHeaders } from "@/lib/asterClientHeaders";
import type { TxCallbacks, AsterTradeParams } from "./shared";
import { toUserFacingError } from "@/lib/userFacingErrors";

export interface TpSlRetryParams {
  userId: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  takeProfit?: number;
  stopLoss?: number;
}

export type CancelAsterOrderParams = {
  userId: string;
  symbol: string;
  orderId?: string | number;
  origClientOrderId?: string;
};

export async function cancelAsterOrder(
  params: CancelAsterOrderParams
): Promise<{ ok: true; data?: unknown; orderId?: string | number } | { ok: false; error: string; code?: number }> {
  const normalizedSymbol = params.symbol
    .replace(/-/g, "")
    .replace(/USDC$/i, "USDT")
    .toUpperCase();
  const body: Record<string, string | number | undefined> = {
    userId: params.userId,
    symbol: normalizedSymbol,
    orderId: params.orderId,
    origClientOrderId: params.origClientOrderId,
  };
  if (params.orderId === undefined) delete body.orderId;
  if (params.origClientOrderId === undefined) delete body.origClientOrderId;

  const res = await fetch("/api/aster/cancel-order", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...asterWalletHeaders(params.userId) },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
    code?: number;
    orderId?: string | number;
    data?: unknown;
  };
  if (res.ok && data.success) {
    return { ok: true, data: data.data, orderId: data.orderId };
  }
  return { ok: false, error: data.error || `Cancel failed (${res.status})`, code: data.code };
}

export async function retryAsterTpSl(
  params: TpSlRetryParams,
  callbacks: TxCallbacks,
): Promise<boolean> {
  const { setTxState, setTxMsg } = callbacks;
  setTxState("setup");
  setTxMsg("Retrying TP/SL...");

  try {
    const body: Record<string, string | number> = {
      userId: params.userId,
      symbol: params.symbol,
      side: params.side,
      quantity: params.quantity,
    };
    if (params.takeProfit) body.takeProfit = params.takeProfit;
    if (params.stopLoss) body.stopLoss = params.stopLoss;

    const res = await fetch("/api/aster/tp-sl", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...asterWalletHeaders(params.userId) },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      setTxMsg("TP/SL retry failed -- tap Retry to try again");
      setTxState("setup");
      return false;
    }

    setTxMsg("TP/SL set successfully");
    setTxState("success");
    return true;
  } catch {
    setTxMsg("TP/SL retry failed -- tap Retry to try again");
    setTxState("setup");
    return false;
  }
}

export async function executeAsterTrade(
  params: AsterTradeParams,
  callbacks: TxCallbacks,
): Promise<TpSlRetryParams | null> {
  const {
    market, side, sizeNum, posValue, lev, otype, price, maxLev,
    marketSymbol, asterUserId, walletAddress, hiddenOrder, tp, sl, onTradeSuccess,
  } = params;
  const { setTxState, setTxMsg } = callbacks;

  const resolvedUserId = walletAddress || asterUserId;
  if (!resolvedUserId) {
    setTxMsg("Connect an EVM wallet to trade on Aster");
    setTxState("error");
    return null;
  }

  setTxState("signing");
  setTxMsg("");

  try {
    const normalizedSymbol = marketSymbol
      .replace(/-/g, "")
      .replace(/USDC$/i, "USDT")
      .toUpperCase();
    const finalSymbol = normalizedSymbol.endsWith("USDT") ? normalizedSymbol : `${market.sym.toUpperCase()}USDT`;
    const res = await fetch("/api/aster/open-position", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...asterWalletHeaders(resolvedUserId) },
      body: JSON.stringify({
        userId: resolvedUserId,
        symbol: finalSymbol,
        side: side === "long" ? "BUY" : "SELL",
        quantity: sizeNum,
        leverage: Math.min(lev, maxLev),
        orderType: otype === "market" ? "MARKET" : "LIMIT",
        price: otype !== "market" && price ? parseFloat(price) : undefined,
        hidden: otype === "limit" && hiddenOrder ? true : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(toUserFacingError(data.error || "Order failed", "trade"));
    }

    recordTrade({ volume: posValue, chain: 'Arbitrum', protocol: 'Aster', market: market.sym });
    checkTradeAchievements({ leverage: lev, category: market.category });

    if (tp || sl) {
      setTxState("setup");
      setTxMsg("Setting TP/SL...");

      const closeSide = side === "long" ? "SELL" : "BUY";
      const tpSlBody: Record<string, string | number> = {
        userId: resolvedUserId,
        symbol: finalSymbol,
        side: closeSide,
        quantity: sizeNum,
      };
      if (tp) tpSlBody.takeProfit = parseFloat(tp);
      if (sl) tpSlBody.stopLoss = parseFloat(sl);

      const retryParams: TpSlRetryParams = {
        userId: resolvedUserId,
        symbol: finalSymbol,
        side: closeSide,
        quantity: sizeNum,
        takeProfit: tp ? parseFloat(tp) : undefined,
        stopLoss: sl ? parseFloat(sl) : undefined,
      };

      try {
        const tpSlRes = await fetch("/api/aster/tp-sl", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...asterWalletHeaders(resolvedUserId) },
          body: JSON.stringify(tpSlBody),
        });
        const tpSlData = await tpSlRes.json().catch(() => ({}));
        if (!tpSlRes.ok || tpSlData.error) {
          setTxMsg(`${side.toUpperCase()} ${market.sym} opened -- TP/SL failed to set`);
          setTxState("setup");
          onTradeSuccess?.();
          return retryParams;
        }
      } catch {
        setTxMsg(`${side.toUpperCase()} ${market.sym} opened -- TP/SL failed to set`);
        setTxState("setup");
        onTradeSuccess?.();
        return retryParams;
      }
    }

    setTxMsg(`${side.toUpperCase()} ${market.sym} executed on Aster`);    setTxState("success");
    onTradeSuccess?.();
    return null;
  } catch (err: unknown) {
    setTxMsg(toUserFacingError(err, "trade"));
    setTxState("error");
    return null;
  }
}
