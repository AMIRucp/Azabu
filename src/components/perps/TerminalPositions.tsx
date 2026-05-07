"use client";
import { useState, useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";
import usePositionStore from "@/stores/usePositionStore";

const T = {
  bg: "#08080c",
  bgCard: "#0f0f14",
  bgEl: "#16161e",
  bgHover: "#1c1c28",
  border: "#1a1a24",
  borderSub: "#131318",
  text: "#e4e4ec",
  text2: "#7a7a90",
  text3: "#44445a",
  green: "#00d492",
  greenDim: "rgba(0,212,146,0.10)",
  red: "#ef4461",
  redDim: "rgba(239,68,97,0.10)",
  orange: "#f97316",
  orangeDim: "rgba(249,115,22,0.10)",
};

const mono = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

const CHAIN_TO_PROTOCOL: Record<string, string[]> = {
  arbitrum: ["aster"],
  hyperliquid: ["hyperliquid"],
};

interface PositionData {
  market: string;
  side: string;
  direction?: string;
  size: number;
  sizeBase?: number;
  sizeUsd?: number;
  notional?: number;
  entryPrice: number;
  liquidationPrice?: number;
  pnlUsd?: number;
  unrealisedPnl?: number;
  pnlPct?: number;
  leverage?: number;
  protocol?: string;
}

interface TerminalPositionsProps {
  chain: "arbitrum" | "hyperliquid" | "lighter";
  livePrices?: Record<string, { price: number; change24h: number }>;
  asterUserId?: string;
}

export default function TerminalPositions({ chain, livePrices, asterUserId }: TerminalPositionsProps) {
  const storePositions = usePositionStore((s) => s.positions);
  const storeLoading = usePositionStore((s) => s.isLoading);

  const positions: PositionData[] = useMemo(() => {
    const protocols = CHAIN_TO_PROTOCOL[chain] || [];
    return storePositions
      .filter((p) => protocols.includes(p.protocol.toLowerCase()))
      .map((p) => ({
        market: p.baseAsset || p.symbol?.replace(/-PERP$/, "") || "UNKNOWN",
        side: p.side.toLowerCase(),
        size: p.sizeBase,
        sizeBase: p.sizeBase,
        sizeUsd: p.sizeUsd,
        notional: p.sizeUsd,
        entryPrice: p.entryPrice,
        liquidationPrice: p.liquidationPrice,
        pnlUsd: p.unrealizedPnl,
        unrealisedPnl: p.unrealizedPnl,
        pnlPct: p.unrealizedPnlPercent,
        leverage: p.leverage,
        protocol: p.protocol.toLowerCase(),
      }));
  }, [storePositions, chain]);

  const loading = storeLoading && positions.length === 0;
  const [closingMarket, setClosingMarket] = useState<string | null>(null);
  const [tpslOpen, setTpslOpen] = useState<number | null>(null);
  const [tpPrice, setTpPrice] = useState("");
  const [slPrice, setSlPrice] = useState("");
  const [tpslSubmitting, setTpslSubmitting] = useState(false);

  const totalPnl = positions.reduce((sum, p) => sum + (p.pnlUsd ?? p.unrealisedPnl ?? 0), 0);

  const handleClose = useCallback(async (pos: PositionData) => {
    setClosingMarket(pos.market);
    try {
      if (pos.protocol === "aster") {
        if (!asterUserId) throw new Error("Connect wallet to close positions");
        const asterSymbol = `${pos.market}USDT`;
        const res = await fetch("/api/aster/close-position", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: asterUserId,
            symbol: asterSymbol,
            side: pos.side === "long" ? "SELL" : "BUY",
            quantity: pos.size || pos.sizeBase || 0,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Failed to close");
      } else if (pos.protocol === "hyperliquid") {
        const { address: hlAddress } = ((window as unknown) as Record<string, unknown>).__evmWallet as { address?: string } || {};
        if (!hlAddress) throw new Error("Connect EVM wallet to close Hyperliquid positions");
        const res = await fetch("/api/hyperliquid/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "place",
            userAddress: hlAddress,
            coin: pos.market,
            isBuy: pos.side !== "long",
            size: (pos.size || pos.sizeBase || 0).toString(),
            price: "0",
            orderType: "market",
            reduceOnly: true,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Failed to close");
      }
    } catch {
      setClosingMarket(null);
    }
  }, [asterUserId]);

  const handleTpSl = useCallback(async (pos: PositionData, _idx: number) => {
    if (!tpPrice && !slPrice) return;
    setTpslSubmitting(true);
    try {
      if (pos.protocol === "aster") {
        if (!asterUserId) throw new Error("Connect wallet to set TP/SL");
        const asterSymbol = `${pos.market}USDT`;
        const closeSide = pos.side === "long" ? "SELL" : "BUY";
        const qty = (pos.size || pos.sizeBase || 0).toString();
        const res = await fetch("/api/aster/tp-sl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: asterUserId,
            symbol: asterSymbol,
            side: closeSide,
            quantity: qty,
            takeProfit: tpPrice || undefined,
            stopLoss: slPrice || undefined,
          }),
        });
        if (!res.ok) {
          await res.json().catch(() => {});
        }
      }
    } catch {
    }
    setTpslSubmitting(false);
    setTpslOpen(null);
    setTpPrice("");
    setSlPrice("");
  }, [tpPrice, slPrice, asterUserId]);

  if (loading && positions.length === 0) {
    return (
      <div style={{ background: T.bg }} data-testid="positions-skeleton">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, padding: "8px 12px", alignItems: "center",
            borderBottom: `1px solid ${T.borderSub}`,
          }}>
            <div style={{ width: 16, height: 16, borderRadius: 8, background: "linear-gradient(90deg, #1E2329 25%, #252a35 50%, #1E2329 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
            <div style={{ width: 40, height: 12, borderRadius: 3, background: "linear-gradient(90deg, #1E2329 25%, #252a35 50%, #1E2329 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
            <div style={{ width: 30, height: 12, borderRadius: 3, background: "linear-gradient(90deg, #1E2329 25%, #252a35 50%, #1E2329 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
            <div style={{ flex: 1 }} />
            <div style={{ width: 60, height: 14, borderRadius: 3, background: "linear-gradient(90deg, #1E2329 25%, #252a35 50%, #1E2329 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
          </div>
        ))}
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", background: T.bg }}>
        <div style={{ fontSize: 12, color: T.text3, fontFamily: mono }} data-testid="positions-empty">No open positions</div>
        <div style={{ fontSize: 10, color: T.text3, fontFamily: mono, marginTop: 4 }}>Open a trade to get started</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 8, background: T.bg }} data-testid="positions-panel">
      {positions.length > 0 && (
        <div style={{
          display: "flex", gap: 16, padding: "8px 6px 12px", borderBottom: `1px solid ${T.borderSub}`,
          marginBottom: 8, flexWrap: "wrap",
        }}>
          {([
            { l: "Positions", v: `${positions.length}`, col: T.text },
            { l: "uPnL", v: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`, col: totalPnl >= 0 ? T.green : T.red },
          ] as const).map(d => (
            <div key={d.l} data-testid={`positions-stat-${d.l.toLowerCase()}`}>
              <div style={{ fontSize: 9, color: T.text3, fontFamily: mono, letterSpacing: "0.06em", marginBottom: 2 }}>{d.l}</div>
              <div style={{ fontSize: 11, color: d.col, fontFamily: mono, fontWeight: 600 }}>{d.v}</div>
            </div>
          ))}
        </div>
      )}

      {positions.map((pos, i) => {
        const posSide = pos.side || (pos.direction === "long" ? "long" : "short");
        const pnl = pos.pnlUsd ?? pos.unrealisedPnl ?? 0;
        const pnlPct = pos.pnlPct ?? 0;
        const isProfit = pnl >= 0;
        const currentPrice = livePrices?.[`${pos.market}-PERP`]?.price || livePrices?.[pos.market]?.price || 0;

        return (
          <div
            key={i}
            data-testid={`position-card-${i}`}
            style={{
              background: T.bgCard,
              borderRadius: 8,
              padding: 14,
              marginBottom: 8,
              border: `1px solid ${T.border}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.text, fontFamily: mono }}>{pos.market}-PERP</span>
                <span
                  data-testid={`position-side-${i}`}
                  style={{
                    fontSize: 10, fontWeight: 700, color: "#fff", fontFamily: mono,
                    background: posSide === "long" ? T.green : T.red,
                    padding: "2px 8px", borderRadius: 4, textTransform: "uppercase",
                  }}
                >
                  {posSide}
                </span>
                {pos.leverage && (
                  <span style={{ fontSize: 10, color: T.text3, fontFamily: mono }}>{pos.leverage}x</span>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  data-testid={`position-pnl-${i}`}
                  style={{ fontSize: 13, fontWeight: 700, color: isProfit ? T.green : T.red, fontFamily: mono, fontVariantNumeric: "tabular-nums", transition: "color 0.3s ease" }}
                >
                  {isProfit ? "+" : ""}{pnl.toFixed(2)} USD
                </div>
                <div style={{ fontSize: 10, color: isProfit ? T.green : T.red, fontFamily: mono, fontVariantNumeric: "tabular-nums", transition: "color 0.3s ease" }}>
                  ({isProfit ? "+" : ""}{pnlPct.toFixed(2)}%)
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
              {[
                { l: "Size", v: `${(pos.sizeBase || pos.size || 0).toFixed(4)} ${pos.market}` },
                { l: "Entry", v: `$${(pos.entryPrice || 0).toFixed(2)}` },
                { l: "Mark", v: currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : "--" },
              ].map(s => (
                <div key={s.l}>
                  <div style={{ fontSize: 9, color: T.text3, fontFamily: mono, marginBottom: 2 }}>{s.l}</div>
                  <div style={{ fontSize: 11, color: T.text, fontFamily: mono, fontWeight: 500 }}>{s.v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button
                data-testid={`position-tpsl-${i}`}
                onClick={() => { setTpslOpen(tpslOpen === i ? null : i); setTpPrice(""); setSlPrice(""); }}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 5, border: `1px solid ${tpslOpen === i ? T.orange : T.border}`,
                  background: tpslOpen === i ? T.orangeDim : T.bgEl, color: tpslOpen === i ? T.orange : T.text2,
                  fontSize: 10, fontWeight: 600, fontFamily: mono, cursor: "pointer",
                }}
              >
                TP / SL
              </button>
              <button
                data-testid={`position-close-${i}`}
                onClick={() => handleClose(pos)}
                disabled={closingMarket === pos.market}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 5, border: "none",
                  background: T.redDim, color: T.red, fontSize: 10, fontWeight: 700, fontFamily: mono,
                  cursor: closingMarket === pos.market ? "wait" : "pointer",
                  opacity: closingMarket === pos.market ? 0.5 : 1,
                }}
              >
                {closingMarket === pos.market ? <Loader2 size={12} style={{ display: "inline", animation: "spin 1s linear infinite" }} /> : "Close"}
              </button>
            </div>

            {tpslOpen === i && (
              <div style={{ marginTop: 8, padding: 10, background: T.bgEl, borderRadius: 6, border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: T.green, fontFamily: mono, marginBottom: 3, fontWeight: 600 }}>Take Profit</div>
                    <input
                      data-testid={`position-tp-input-${i}`}
                      type="number"
                      placeholder="Price"
                      value={tpPrice}
                      onChange={(e) => setTpPrice(e.target.value)}
                      style={{
                        width: "100%", padding: "6px 8px", background: T.bg, border: `1px solid ${T.border}`,
                        borderRadius: 4, color: T.text, fontSize: 11, fontFamily: mono, outline: "none",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: T.red, fontFamily: mono, marginBottom: 3, fontWeight: 600 }}>Stop Loss</div>
                    <input
                      data-testid={`position-sl-input-${i}`}
                      type="number"
                      placeholder="Price"
                      value={slPrice}
                      onChange={(e) => setSlPrice(e.target.value)}
                      style={{
                        width: "100%", padding: "6px 8px", background: T.bg, border: `1px solid ${T.border}`,
                        borderRadius: 4, color: T.text, fontSize: 11, fontFamily: mono, outline: "none",
                      }}
                    />
                  </div>
                </div>
                <button
                  data-testid={`position-tpsl-confirm-${i}`}
                  onClick={() => handleTpSl(pos, i)}
                  disabled={tpslSubmitting || (!tpPrice && !slPrice)}
                  style={{
                    width: "100%", padding: "7px 0", borderRadius: 5, border: "none",
                    background: (!tpPrice && !slPrice) ? T.bgHover : T.orangeDim,
                    color: (!tpPrice && !slPrice) ? T.text3 : T.orange,
                    fontSize: 10, fontWeight: 700, fontFamily: mono,
                    cursor: (!tpPrice && !slPrice) || tpslSubmitting ? "not-allowed" : "pointer",
                    opacity: tpslSubmitting ? 0.5 : 1,
                  }}
                >
                  {tpslSubmitting ? "Setting..." : "Confirm TP/SL"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
