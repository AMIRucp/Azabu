"use client";

import { useState, useCallback, useMemo } from "react";
import { Loader2, TrendingUp, TrendingDown, Plus, Minus, X } from "lucide-react";
import usePositionStore from "@/stores/usePositionStore";
import useMarketStore from "@/stores/useMarketStore";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { useTradeExecution } from "@/hooks/useTradeExecution";
import { useCollateralBalance } from "@/hooks/useCollateralBalance";

const MONO = "'JetBrains Mono', 'SF Mono', monospace";
const SANS = "'Inter', system-ui, sans-serif";

type PanelMode = "none" | "add" | "reduce";

interface ActivePositionCardProps {
  assetSym: string;
}

export default function ActivePositionCard({ assetSym }: ActivePositionCardProps) {
  const positions = usePositionStore((s) => s.positions);
  const livePrices = useMarketStore((s) => s.livePrices);
  const { evmAddress } = useEvmWallet();
  const { txState, execute } = useTradeExecution();
  const [closing, setClosing] = useState(false);
  const [panel, setPanel] = useState<PanelMode>("none");
  const [addSizeUsd, setAddSizeUsd] = useState("");
  const [reducePct, setReducePct] = useState(50);

  const upperSym = assetSym.toUpperCase();

  const position = useMemo(() => {
    return positions.find(p => p.baseAsset.toUpperCase() === upperSym);
  }, [positions, upperSym]);

  const currentPrice = useMemo(() => {
    if (!position) return 0;
    return (
      livePrices[`${upperSym}-PERP`]?.price ||
      livePrices[`${upperSym}USDT`]?.price ||
      livePrices[upperSym]?.price ||
      0
    );
  }, [position, livePrices, upperSym]);

  const addSizeNum = parseFloat(addSizeUsd) || 0;
  const positionProtocol = position?.protocol?.toLowerCase() || "hyperliquid";
  const addChain = (positionProtocol === "aster" ? "arbitrum" : "hyperliquid") as "arbitrum" | "hyperliquid";
  const addCollateral = addSizeNum / (position?.leverage || 5);
  const { deficit: addDeficit } = useCollateralBalance(addChain, addCollateral);

  const reduceQty = position ? (position.sizeBase * reducePct) / 100 : 0;

  const handleClose = useCallback(async () => {
    if (!position || closing) return;
    setClosing(true);
    try {
      if (positionProtocol === "aster") {
        if (!evmAddress) throw new Error("Connect wallet to close");
        const asterSymbol = `${position.baseAsset}USDT`;
        const res = await fetch("/api/aster/close-position", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: evmAddress,
            symbol: asterSymbol,
            side: position.side === "LONG" ? "SELL" : "BUY",
            quantity: position.sizeBase,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Failed to close");
      } else {
        if (!evmAddress) throw new Error("Connect EVM wallet to close");
        const res = await fetch("/api/hyperliquid/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "place",
            userAddress: evmAddress,
            coin: position.baseAsset,
            isBuy: position.side !== "LONG",
            size: position.sizeBase.toString(),
            price: "0",
            orderType: "market",
            reduceOnly: true,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Failed to close");
      }
    } catch (err) {
      setClosing(false);
    }
  }, [position, closing, evmAddress, positionProtocol]);

  const handleAdd = useCallback(async () => {
    if (!position || !addSizeNum || addSizeNum <= 0 || !currentPrice) return;
    const marketSymbol = positionProtocol === "aster" ? `${position.baseAsset}USDT` : position.symbol;
    const assetQty = addSizeNum / currentPrice;
    await execute({
      chain: addChain,
      market: {
        sym: position.baseAsset,
        price: currentPrice,
        maxLev: position.leverage || 20,
        marketName: marketSymbol,
      },
      side: position.side === "LONG" ? "long" : "short",
      sizeNum: assetQty,
      posValue: addSizeNum,
      lev: position.leverage || 5,
      otype: "market",
      price: currentPrice.toString(),
      maxLev: position.leverage || 20,
      marketSymbol,
      collateral: addCollateral,
      tp: "",
      sl: "",
      hiddenOrder: false,
      asterUserId: evmAddress || undefined,
      onTradeSuccess: () => {
        setAddSizeUsd("");
        setPanel("none");
      },
    });
  }, [position, addSizeNum, currentPrice, positionProtocol, addChain, addCollateral, evmAddress, execute]);

  const handleReduce = useCallback(async () => {
    if (!position || reduceQty <= 0 || !currentPrice) return;
    const marketSymbol = positionProtocol === "aster" ? `${position.baseAsset}USDT` : position.symbol;

    if (positionProtocol === "aster") {
      if (!evmAddress) return;
      try {
        const res = await fetch("/api/aster/close-position", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: evmAddress,
            symbol: marketSymbol,
            side: position.side === "LONG" ? "SELL" : "BUY",
            quantity: reduceQty,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Failed to reduce");
        setPanel("none");
      } catch {
      }
    } else {
      await execute({
        chain: "hyperliquid",
        market: {
          sym: position.baseAsset,
          price: currentPrice,
          maxLev: position.leverage || 20,
          marketName: marketSymbol,
        },
        side: position.side === "LONG" ? "short" : "long",
        sizeNum: reduceQty,
        posValue: reduceQty * currentPrice,
        lev: position.leverage || 5,
        otype: "market",
        price: currentPrice.toString(),
        maxLev: position.leverage || 20,
        marketSymbol,
        collateral: 0,
        tp: "",
        sl: "",
        hiddenOrder: false,
        asterUserId: evmAddress || undefined,
        onTradeSuccess: () => {
          setPanel("none");
          setReducePct(50);
        },
      });
    }
  }, [position, reduceQty, currentPrice, positionProtocol, evmAddress, execute]);

  if (!position) return null;

  const isLong = position.side === "LONG";
  const pnl = position.unrealizedPnl;
  const pnlPct = position.unrealizedPnlPercent;
  const isProfit = pnl >= 0;
  const accentColor = isProfit ? "#22C55E" : "#EF4444";
  const liqDistPct = position.liquidationDistance ?? 0;

  const togglePanel = (p: PanelMode) => setPanel(prev => prev === p ? "none" : p);

  return (
    <div
      data-testid="active-position-card"
      style={{
        background: "#0C0D10",
        border: `1px solid ${isLong ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
        borderRadius: 14,
        padding: "12px 14px",
        fontFamily: SANS,
      }}
    >
      {/* Header row: direction badge + PnL */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isLong ? <TrendingUp size={14} style={{ color: "#22C55E" }} /> : <TrendingDown size={14} style={{ color: "#EF4444" }} />}
          <span style={{ fontSize: 13, fontWeight: 700, color: "#E6EDF3" }}>{assetSym}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: "#fff", fontFamily: MONO,
            background: isLong ? "#22C55E" : "#EF4444",
            padding: "2px 7px", borderRadius: 5,
          }}>
            {isLong ? "LONG" : "SHORT"}
          </span>
          {position.leverage > 0 && (
            <span style={{ fontSize: 10, color: "#6B7280", fontFamily: MONO }}>{position.leverage}x</span>
          )}
        </div>

        <div data-testid="active-position-pnl" style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: accentColor, fontFamily: MONO }}>
            {isProfit ? "+" : ""}{pnl.toFixed(2)} USD
          </div>
          <div style={{ fontSize: 10, color: accentColor, fontFamily: MONO }}>
            ({isProfit ? "+" : ""}{pnlPct.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
        {[
          { l: "Size", v: `$${position.sizeUsd.toFixed(0)}` },
          { l: "Entry", v: `$${position.entryPrice.toFixed(2)}` },
          { l: "Liq dist", v: liqDistPct > 0 ? `-${liqDistPct.toFixed(1)}%` : "--" },
        ].map(item => (
          <div key={item.l}>
            <div style={{ fontSize: 9, color: "#555B6A", fontFamily: MONO, marginBottom: 2, letterSpacing: "0.04em" }}>{item.l}</div>
            <div style={{ fontSize: 11, color: "#9BA4AE", fontFamily: MONO, fontWeight: 500 }}>{item.v}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          data-testid="active-position-add"
          onClick={() => togglePanel("add")}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
            background: panel === "add" ? "rgba(212,165,116,0.12)" : "rgba(255,255,255,0.04)",
            color: panel === "add" ? "#D4A574" : "#9BA4AE",
            fontSize: 12, fontWeight: 700, fontFamily: MONO, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}
        >
          <Plus size={11} />
          Add
        </button>
        <button
          data-testid="active-position-reduce"
          onClick={() => togglePanel("reduce")}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
            background: panel === "reduce" ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)",
            color: panel === "reduce" ? "#818CF8" : "#9BA4AE",
            fontSize: 12, fontWeight: 700, fontFamily: MONO, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}
        >
          <Minus size={11} />
          Reduce
        </button>
        <button
          data-testid="active-position-close"
          onClick={handleClose}
          disabled={closing}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
            background: "rgba(239,68,68,0.08)", color: "#EF4444",
            fontSize: 12, fontWeight: 700, fontFamily: MONO, cursor: closing ? "wait" : "pointer",
            opacity: closing ? 0.5 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          {closing ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : null}
          Close
        </button>
      </div>

      {/* Add Panel */}
      {panel === "add" && (
        <div style={{
          marginTop: 10, padding: "12px 10px", borderRadius: 10,
          background: "rgba(255,255,255,0.02)", border: "1px solid #1A1D24",
        }}>
          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 8 }}>Add to position (market order)</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 16, color: "#6B7280", fontFamily: MONO, lineHeight: "34px" }}>$</span>
            <input
              data-testid="active-position-add-input"
              type="number"
              inputMode="decimal"
              value={addSizeUsd}
              onChange={e => setAddSizeUsd(e.target.value)}
              placeholder="0"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                borderBottom: "1px solid #2A2D35",
                fontSize: 20, fontWeight: 700, color: "#E6EDF3", fontFamily: MONO,
                paddingBottom: 4,
              }}
            />
          </div>
          {addDeficit > 0 && addSizeNum > 0 && (
            <div style={{ fontSize: 10, color: "#F97316", marginBottom: 8, fontFamily: MONO }}>
              Need ${addDeficit.toFixed(2)} more collateral to add
            </div>
          )}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              data-testid="active-position-add-confirm"
              onClick={handleAdd}
              disabled={!addSizeNum || txState === "signing" || addDeficit > 0}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 7, border: "none",
                background: (!addSizeNum || addDeficit > 0) ? "rgba(255,255,255,0.04)" : `rgba(${isLong ? "34,197,94" : "239,68,68"},0.15)`,
                color: (!addSizeNum || addDeficit > 0) ? "#3A4050" : (isLong ? "#22C55E" : "#EF4444"),
                fontSize: 12, fontWeight: 700, fontFamily: MONO,
                cursor: (!addSizeNum || txState === "signing") ? "not-allowed" : "pointer",
                opacity: txState === "signing" ? 0.6 : 1,
              }}
            >
              {txState === "signing" ? "Adding…" : `Add ${isLong ? "Long" : "Short"}`}
            </button>
            <button
              data-testid="active-position-add-cancel"
              onClick={() => { setPanel("none"); setAddSizeUsd(""); }}
              style={{
                padding: "8px 12px", borderRadius: 7, border: "none",
                background: "rgba(255,255,255,0.03)", color: "#6B7280",
                fontSize: 12, fontFamily: MONO, cursor: "pointer",
                display: "flex", alignItems: "center",
              }}
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Reduce Panel */}
      {panel === "reduce" && position && (
        <div style={{
          marginTop: 10, padding: "12px 10px", borderRadius: 10,
          background: "rgba(255,255,255,0.02)", border: "1px solid #1A1D24",
        }}>
          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 8 }}>Reduce position (market order)</div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "#9BA4AE", fontFamily: MONO }}>
              {reducePct}% — {reduceQty.toFixed(4)} {position.baseAsset}
            </span>
            <span style={{ fontSize: 11, color: "#9BA4AE", fontFamily: MONO }}>
              ≈ ${(reduceQty * currentPrice).toFixed(2)}
            </span>
          </div>

          <input
            data-testid="active-position-reduce-slider"
            type="range"
            min={10}
            max={100}
            step={5}
            value={reducePct}
            onChange={e => setReducePct(Number(e.target.value))}
            style={{ width: "100%", marginBottom: 8, accentColor: "#818CF8" }}
          />

          <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
            {[25, 50, 75, 100].map(p => (
              <button
                key={p}
                data-testid={`reduce-preset-${p}`}
                onClick={() => setReducePct(p)}
                style={{
                  flex: 1, padding: "4px 0", borderRadius: 5, border: "none",
                  background: reducePct === p ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                  color: reducePct === p ? "#818CF8" : "#555B6A",
                  fontSize: 11, fontFamily: MONO, cursor: "pointer",
                }}
              >
                {p === 100 ? "Max" : `${p}%`}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              data-testid="active-position-reduce-confirm"
              onClick={handleReduce}
              disabled={txState === "signing"}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 7, border: "none",
                background: "rgba(99,102,241,0.12)",
                color: "#818CF8",
                fontSize: 12, fontWeight: 700, fontFamily: MONO,
                cursor: txState === "signing" ? "not-allowed" : "pointer",
                opacity: txState === "signing" ? 0.6 : 1,
              }}
            >
              {txState === "signing" ? "Reducing…" : `Reduce ${reducePct === 100 ? "All" : `${reducePct}%`}`}
            </button>
            <button
              data-testid="active-position-reduce-cancel"
              onClick={() => setPanel("none")}
              style={{
                padding: "8px 12px", borderRadius: 7, border: "none",
                background: "rgba(255,255,255,0.03)", color: "#6B7280",
                fontSize: 12, fontFamily: MONO, cursor: "pointer",
                display: "flex", alignItems: "center",
              }}
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
