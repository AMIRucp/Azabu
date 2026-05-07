import { recordTrade } from "@/services/xpService";
import { checkTradeAchievements } from "@/services/achievements";
import type { TxCallbacks, AsterTradeParams } from "./shared";

export interface TpSlRetryParams {
  userId: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  takeProfit?: number;
  stopLoss?: number;
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
      headers: { "Content-Type": "application/json" },
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

  const resolvedUserId = asterUserId || walletAddress;
  if (!resolvedUserId) {
    setTxMsg("Connect an EVM wallet to trade on Aster");
    setTxState("error");
    return null;
  }

  setTxState("signing");
  setTxMsg("");

  try {
    const asterSymbol = marketSymbol.endsWith("USDT") ? marketSymbol : `${market.sym}USDT`;
    const res = await fetch("/api/aster/open-position", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: resolvedUserId,
        symbol: asterSymbol,
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
      const msg = data.error || "Order failed";
      if (/region|geo|restricted|not available/i.test(msg)) {
        throw new Error("Aster is not available in your current region. Try using a VPN or deploying from an allowed location.");
      }
      throw new Error(msg);
    }

    recordTrade({ volume: posValue, chain: 'Arbitrum', protocol: 'Aster', market: market.sym });
    checkTradeAchievements({ leverage: lev, category: market.category });

    if (tp || sl) {
      setTxState("setup");
      setTxMsg("Setting TP/SL...");

      const closeSide = side === "long" ? "SELL" : "BUY";
      const tpSlBody: Record<string, string | number> = {
        userId: resolvedUserId,
        symbol: asterSymbol,
        side: closeSide,
        quantity: sizeNum,
      };
      if (tp) tpSlBody.takeProfit = parseFloat(tp);
      if (sl) tpSlBody.stopLoss = parseFloat(sl);

      const retryParams: TpSlRetryParams = {
        userId: resolvedUserId,
        symbol: asterSymbol,
        side: closeSide,
        quantity: sizeNum,
        takeProfit: tp ? parseFloat(tp) : undefined,
        stopLoss: sl ? parseFloat(sl) : undefined,
      };

      try {
        const tpSlRes = await fetch("/api/aster/tp-sl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

    setTxMsg(`${side.toUpperCase()} ${market.sym} executed on Aster`);
    setTxState("success");
    onTradeSuccess?.();
    return null;
  } catch (err: unknown) {
    setTxMsg(err instanceof Error ? err.message : "Failed to submit order");
    setTxState("error");
    return null;
  }
}
