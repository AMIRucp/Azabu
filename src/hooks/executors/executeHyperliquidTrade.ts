import type { TxCallbacks, HyperliquidTradeParams } from "./shared";
import { recordTradeToDb } from "./shared";

async function ensureAgent(
  evmAddress: string,
  callbacks: TxCallbacks,
): Promise<boolean> {
  const { setTxMsg } = callbacks;

  const checkRes = await fetch("/api/hyperliquid/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "check", userAddress: evmAddress }),
  });
  const checkData = await checkRes.json();

  if (checkData.hasAgent) return true;

  setTxMsg("Generating agent wallet...");
  const genRes = await fetch("/api/hyperliquid/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "generate", userAddress: evmAddress }),
  });
  const genData = await genRes.json();

  if (!genRes.ok || !genData.eip712Payload) {
    callbacks.setTxMsg("Failed to generate agent wallet");
    callbacks.setTxState("error");
    return false;
  }

  setTxMsg("Please sign the agent approval in your wallet...");

  try {
    const { ethers } = await import("ethers");
    const provider = new ethers.BrowserProvider(
      (window as any).ethereum || (window as any).phantom?.ethereum,
    );
    const signer = await provider.getSigner();

    const payload = genData.eip712Payload;
    const signature = await signer.signTypedData(
      payload.domain,
      payload.types,
      payload.message,
    );

    setTxMsg("Confirming agent...");
    const confirmRes = await fetch("/api/hyperliquid/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "confirm",
        userAddress: evmAddress,
        agentPrivateKey: genData.agentPrivateKey,
        signature,
      }),
    });

    if (!confirmRes.ok) {
      callbacks.setTxMsg("Failed to confirm agent");
      callbacks.setTxState("error");
      return false;
    }

    return true;
  } catch (e: any) {
    if (e?.code === 4001 || e?.code === "ACTION_REJECTED") {
      callbacks.setTxMsg("Agent approval rejected");
    } else {
      callbacks.setTxMsg("Failed to sign agent approval");
    }
    callbacks.setTxState("error");
    return false;
  }
}

export async function executeHyperliquidTrade(
  params: HyperliquidTradeParams,
  callbacks: TxCallbacks,
) {
  const { setTxState, setTxMsg, setTxSig } = callbacks;
  const { market, side, sizeNum, lev, otype, price, evmAddress, tp, sl, onTradeSuccess } = params;

  try {
    setTxState("signing");
    setTxMsg("Checking Hyperliquid agent...");

    const agentReady = await ensureAgent(evmAddress, callbacks);
    if (!agentReady) return;

    const coin = market.sym
      .replace(/-PERP$/i, "")
      .replace(/USDT$/i, "")
      .replace(/USDC$/i, "");

    setTxMsg("Setting leverage on Hyperliquid...");
    let effectiveLev = lev;
    try {
      const levRes = await fetch("/api/hyperliquid/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "leverage",
          userAddress: evmAddress,
          coin,
          leverage: lev,
          isCross: true,
        }),
      });
      const levData = await levRes.json().catch(() => ({}));
      if (!levRes.ok) {
        const errMsg = levData.error || "Failed to set leverage";
        if (!errMsg.includes("already")) {
          setTxMsg(errMsg);
          setTxState("error");
          return;
        }
      }
      if (levData.leverage) effectiveLev = levData.leverage;
    } catch (e: any) {
      setTxMsg("Failed to set leverage: " + (e.message || "unknown error"));
      setTxState("error");
      return;
    }

    setTxMsg("Placing order on Hyperliquid...");

    const orderBody: Record<string, any> = {
      action: "place",
      userAddress: evmAddress,
      coin,
      isBuy: side === "long",
      size: sizeNum.toString(),
      price: price || market.price.toString(),
      orderType: otype === "market" ? "market" : "limit",
      reduceOnly: false,
    };

    if (tp && parseFloat(tp) > 0) {
      orderBody.tpsl = { type: "tp", triggerPx: tp };
    }

    const orderRes = await fetch("/api/hyperliquid/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderBody),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok || orderData.error) {
      setTxMsg(orderData.error || "Order failed");
      setTxState("error");
      return;
    }

    if (sl && parseFloat(sl) > 0) {
      try {
        await fetch("/api/hyperliquid/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "tpsl",
            userAddress: evmAddress,
            coin,
            isBuy: side === "long",
            size: sizeNum.toString(),
            triggerPx: sl,
            tpslType: "sl",
          }),
        });
      } catch {
      }
    }

    setTxMsg("Order placed on Hyperliquid");
    setTxSig(null);
    setTxState("success");

    recordTradeToDb({
      wallet: evmAddress,
      protocol: "hyperliquid",
      chain: "hyperliquid",
      market: coin,
      side,
      sizeUsd: sizeNum * market.price,
      entryPrice: market.price,
      leverage: effectiveLev,
      txSignature: "hl-" + Date.now(),
    });

    onTradeSuccess?.();
  } catch (e: any) {
    setTxMsg(e.message || "Hyperliquid trade failed");
    setTxState("error");
  }
}
