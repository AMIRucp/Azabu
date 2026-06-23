"use client";

import { useState, useMemo, useCallback } from "react";
import TokenIcon from "@/components/shared/TokenIcon";
import PillButton from "@/components/shared/PillButton";
import usePositionStore from "@/stores/usePositionStore";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { asterWalletHeaders } from "@/lib/asterClientHeaders";
import { tradePageTokens as T } from "./tradePageTokens";

type BottomTab = "positions" | "orders" | "history";

function fmtUsd(n: number, signed = false): string {
  const prefix = signed && n > 0 ? "+" : "";
  if (Math.abs(n) >= 1000) return `${prefix}$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `${prefix}$${n.toFixed(2)}`;
}

function fmtPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

interface TradeBottomPanelProps {
  isMobile?: boolean;
  embedded?: boolean;
  onTradeSuccess?: () => void;
}

export default function TradeBottomPanel({ isMobile, embedded, onTradeSuccess }: TradeBottomPanelProps) {
  const [tab, setTab] = useState<BottomTab>("positions");
  const [closingId, setClosingId] = useState<string | null>(null);
  const positions = usePositionStore((s) => s.positions);
  const totalPositionValue = usePositionStore((s) => s.totalPositionValue);
  const totalMarginUsed = usePositionStore((s) => s.totalMarginUsed);
  const totalUnrealizedPnl = usePositionStore((s) => s.totalUnrealizedPnl);
  const { evmAddress } = useEvmWallet();

  const roiPct = totalMarginUsed > 0 ? (totalUnrealizedPnl / totalMarginUsed) * 100 : 0;

  const tabs: { key: BottomTab; label: string; count?: number }[] = [
    { key: "positions", label: "Positions", count: positions.length },
    { key: "orders", label: "Open Orders" },
    { key: "history", label: "Trade History" },
  ];

  const handleClose = useCallback(async (pos: (typeof positions)[0]) => {
    if (closingId) return;
    setClosingId(pos.id);
    try {
      if (pos.protocol === "aster") {
        if (!evmAddress) throw new Error("Connect wallet");
        const res = await fetch("/api/aster/close-position", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...asterWalletHeaders(evmAddress) },
          body: JSON.stringify({
            userId: evmAddress,
            symbol: `${pos.baseAsset}USDT`,
            side: pos.side === "LONG" ? "SELL" : "BUY",
            quantity: pos.sizeBase,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error);
      } else if (pos.protocol === "hyperliquid") {
        if (!evmAddress) throw new Error("Connect wallet");
        const res = await fetch("/api/hyperliquid/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "place",
            userAddress: evmAddress,
            coin: pos.baseAsset,
            isBuy: pos.side !== "LONG",
            size: pos.sizeBase.toString(),
            price: "0",
            orderType: "market",
            reduceOnly: true,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error);
      }
      onTradeSuccess?.();
    } catch {
      /* user-facing errors handled elsewhere */
    } finally {
      setClosingId(null);
    }
  }, [closingId, evmAddress, onTradeSuccess]);

  const summaryItems = useMemo(() => [
    { label: `${positions.length} OPEN`, value: null },
    { label: "VALUE", value: fmtUsd(totalPositionValue) },
    { label: "MARGIN", value: fmtUsd(totalMarginUsed) },
    {
      label: "ROI",
      value: `${roiPct >= 0 ? "+" : ""}${roiPct.toFixed(1)}%`,
      color: roiPct >= 0 ? T.green : T.red,
    },
  ], [positions.length, totalPositionValue, totalMarginUsed, roiPct]);

  const headerStyle = {
    fontSize: 9,
    fontWeight: 700 as const,
    letterSpacing: "0.08em",
    color: T.label,
    fontFamily: T.sans,
    textTransform: "uppercase" as const,
    padding: isMobile ? "8px 10px" : "8px 14px",
    textAlign: "left" as const,
    borderBottom: `1px solid ${T.stroke}`,
  };

  return (
    <div
      data-testid="trade-bottom-panel"
      style={{
        flexShrink: 0,
        height: isMobile ? 280 : T.bottomHeight,
        background: T.bg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        margin: isMobile ? "0 16px 16px" : embedded ? 0 : "0 0 20px",
        borderRadius: embedded ? 0 : 12,
        border: embedded ? "none" : `1px solid ${T.stroke}`,
        borderTop: embedded ? `1px solid ${T.stroke}` : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: `1px solid ${T.stroke}`,
          flexShrink: 0,
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <PillButton
                key={t.key}
                variant="accent"
                active={active}
                data-testid={`trade-bottom-tab-${t.key}`}
                onClick={() => setTab(t.key)}
                style={{ height: 32, padding: "0 14px", fontSize: 12, fontWeight: 500 }}
              >
                {t.label}
                {t.count !== undefined ? ` ${t.count}` : ""}
              </PillButton>
            );
          })}
        </div>

        {tab === "positions" && positions.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 20, paddingRight: 4 }}>
            {summaryItems.map((s) => (
              <div key={s.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: T.label, fontFamily: T.sans, letterSpacing: "0.06em" }}>
                  {s.label}
                </div>
                {s.value && (
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: T.mono,
                      color: s.color ?? T.white,
                    }}
                  >
                    {s.value}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {tab === "positions" && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.mono, fontSize: 11 }}>
            <thead>
              <tr>
                {["MARKET", "SIZE", "ENTRY", "MARK", "TP / SL", "PNL", "ACTIONS"].map((h, i) => (
                  <th key={h} style={{ ...headerStyle, textAlign: i === 0 || i === 6 ? "left" : "right" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: "center", color: T.label, fontFamily: T.sans }}>
                    No open positions
                  </td>
                </tr>
              ) : (
                positions.map((pos) => {
                  const isLong = pos.side === "LONG";
                  const pnlColor = pos.unrealizedPnl >= 0 ? T.green : T.red;
                  const sideColor = isLong ? T.green : T.red;
                  return (
                    <tr
                      key={pos.id}
                      data-testid={`trade-position-row-${pos.baseAsset}`}
                      style={{ borderBottom: `1px solid ${T.stroke}` }}
                    >
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <TokenIcon symbol={pos.baseAsset} size={20} />
                          <div>
                            <div style={{ fontWeight: 600, color: T.white, fontSize: 12 }}>
                              {pos.baseAsset}-PERP
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color: sideColor,
                                  letterSpacing: "0.04em",
                                }}
                              >
                                {isLong ? "LONG" : "SHORT"}
                              </span>
                              <span style={{ fontSize: 9, color: T.label }}>{pos.leverage}x</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: T.white }}>
                        {fmtUsd(pos.sizeUsd)}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: T.muted }}>
                        ${fmtPrice(pos.entryPrice)}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: T.white }}>
                        ${fmtPrice(pos.markPrice)}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <span style={{ color: T.green, fontSize: 10 }}>—</span>
                        <span style={{ color: T.label, margin: "0 4px" }}>/</span>
                        <span style={{ color: T.red, fontSize: 10 }}>—</span>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <div style={{ color: pnlColor, fontWeight: 600 }}>
                          {fmtUsd(pos.unrealizedPnl, true)}
                        </div>
                        <div style={{ fontSize: 9, color: pnlColor, marginTop: 2 }}>
                          ({pos.unrealizedPnlPercent >= 0 ? "+" : ""}
                          {pos.unrealizedPnlPercent.toFixed(2)}%)
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            data-testid={`trade-position-edit-${pos.baseAsset}`}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 6,
                              border: `1px solid ${T.cardBorder}`,
                              background: "rgba(255,255,255,0.04)",
                              color: T.muted,
                              fontSize: 10,
                              fontWeight: 600,
                              fontFamily: T.sans,
                              cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            data-testid={`trade-position-close-${pos.baseAsset}`}
                            onClick={() => handleClose(pos)}
                            disabled={closingId === pos.id}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 6,
                              border: "1px solid rgba(248,113,113,0.3)",
                              background: "rgba(248,113,113,0.1)",
                              color: T.red,
                              fontSize: 10,
                              fontWeight: 600,
                              fontFamily: T.sans,
                              cursor: closingId === pos.id ? "wait" : "pointer",
                              opacity: closingId === pos.id ? 0.6 : 1,
                            }}
                          >
                            Close
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {tab === "orders" && (
          <div style={{ padding: 32, textAlign: "center", color: T.label, fontFamily: T.sans, fontSize: 13 }}>
            No open orders
          </div>
        )}

        {tab === "history" && (
          <div style={{ padding: 32, textAlign: "center", color: T.label, fontFamily: T.sans, fontSize: 13 }}>
            No trade history yet
          </div>
        )}
      </div>
    </div>
  );
}
