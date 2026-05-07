"use client";

import { useState } from "react";
import { useHyperliquidPortfolio } from "@/hooks/useHyperliquidPortfolio";
import { T, mono } from "@/components/perps/terminalTheme";
import { executeHyperliquidClose } from "@/hooks/executors/executeHyperliquidClose";
import type { TxState } from "@/hooks/executors/shared";

const sans = "'Inter', -apple-system, sans-serif";

interface HyperliquidPositionsProps {
  address: string;
}

export default function HyperliquidPositions({ address }: HyperliquidPositionsProps) {
  const { account, positions, openOrders, isLoading, error, refetch } = useHyperliquidPortfolio({
    address,
    enabled: !!address,
    pollInterval: 15000,
  });

  const [closingPositionIndex, setClosingPositionIndex] = useState<number | null>(null);
  const [txState, setTxState] = useState<TxState>("idle");
  const [txMsg, setTxMsg] = useState("");

  const handleClosePosition = async (position: any, index: number) => {
    setClosingPositionIndex(index);
    setTxState("signing");
    setTxMsg("Closing position...");

    try {
      const marketsRes = await fetch("/api/markets/unified");
      const marketsData = await marketsRes.json();
      
      const market = marketsData.markets?.find(
        (m: any) => m.protocol === "hyperliquid" && 
                    m.type === "perp" && 
                    m.baseAsset === position.coin
      );

      if (!market || market.assetId === undefined) {
        setTxMsg(`Could not find market for ${position.coin}`);
        setTxState("error");
        setTimeout(() => {
          setClosingPositionIndex(null);
          setTxState("idle");
          setTxMsg("");
        }, 3000);
        return;
      }

      await executeHyperliquidClose(
        {
          assetId: market.assetId,
          size: Math.abs(position.size),
          side: position.side,
          coin: position.coin,
          markPrice: position.markPrice || market.price,
          onSuccess: () => {
            setTimeout(() => {
              setClosingPositionIndex(null);
              setTxState("idle");
              setTxMsg("");
              refetch();
            }, 2000);
          },
        },
        {
          setTxState,
          setTxMsg,
          setTxSig: () => {},
        }
      );
    } catch (err) {
      setTxMsg("Failed to close position");
      setTxState("error");
      setTimeout(() => {
        setClosingPositionIndex(null);
        setTxState("idle");
        setTxMsg("");
      }, 3000);
    }
  };

  if (!address) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: T.text3, fontFamily: sans, fontSize: 12 }}>
        Connect wallet to view positions
      </div>
    );
  }

  if (isLoading && !account) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: T.text3, fontFamily: sans, fontSize: 12 }}>
        Loading portfolio...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: T.red, fontFamily: sans, fontSize: 12 }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: sans }}>
      {account && (
        <div style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${T.border}`,
          background: "rgba(255,255,255,0.02)",
        }}>
          <div style={{ fontSize: 11, color: T.text3, marginBottom: 8, fontWeight: 500 }}>
            ACCOUNT BALANCE
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, color: T.text3, marginBottom: 2 }}>Total Value</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: mono, color: T.text }}>
                ${account.accountValue.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.text3, marginBottom: 2 }}>Available</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: mono, color: T.green }}>
                ${account.availableBalance.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.text3, marginBottom: 2 }}>Margin Used</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: mono, color: T.orange }}>
                ${account.marginUsed.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.text3, marginBottom: 2 }}>Position Value</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: mono, color: T.text2 }}>
                ${account.positionValue.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.text }}>
          OPEN POSITIONS ({positions.length})
        </div>
        {positions.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: T.text3, fontSize: 11 }}>
            No open positions
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {positions.map((pos, i) => {
              const isProfitable = pos.unrealizedPnl >= 0;
              const isClosing = closingPositionIndex === i;
              return (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    opacity: isClosing ? 0.6 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: mono }}>
                          {pos.coin}
                        </span>
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: pos.side === "long" ? "rgba(14,203,129,0.15)" : "rgba(246,70,93,0.15)",
                          color: pos.side === "long" ? T.green : T.red,
                        }}>
                          {pos.side === "long" ? "LONG 📈" : "SHORT 📉"}
                        </span>
                        <span style={{
                          fontSize: 9,
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "rgba(212,165,116,0.15)",
                          color: T.orange,
                          fontFamily: mono,
                        }}>
                          {pos.leverage}x
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: T.text3 }}>
                        Size: {pos.size.toFixed(4)} {pos.coin}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: mono,
                        color: isProfitable ? T.green : T.red,
                      }}>
                        {isProfitable ? "+" : ""}${pos.unrealizedPnl.toFixed(2)}
                      </div>
                      <div style={{
                        fontSize: 10,
                        fontFamily: mono,
                        color: isProfitable ? T.green : T.red,
                      }}>
                        {isProfitable ? "+" : ""}{pos.returnOnEquity.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 10, color: T.text3, marginBottom: 8 }}>
                    <div>
                      <span style={{ color: T.text3 }}>Entry: </span>
                      <span style={{ fontFamily: mono, color: T.text2 }}>${pos.entryPrice.toFixed(2)}</span>
                    </div>
                    {pos.liquidationPrice && (
                      <div>
                        <span style={{ color: T.text3 }}>Liq: </span>
                        <span style={{ fontFamily: mono, color: T.red }}>${pos.liquidationPrice.toFixed(2)}</span>
                      </div>
                    )}
                    <div>
                      <span style={{ color: T.text3 }}>Type: </span>
                      <span style={{ fontFamily: mono, color: T.text2 }}>{pos.marginType}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleClosePosition(pos, i)}
                    disabled={isClosing}
                    style={{
                      width: "100%",
                      padding: "8px 0",
                      borderRadius: 6,
                      border: "1px solid rgba(239,68,68,0.3)",
                      background: isClosing ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.15)",
                      color: T.red,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: mono,
                      cursor: isClosing ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      letterSpacing: "0.04em",
                    }}
                    onMouseEnter={(e) => {
                      if (!isClosing) {
                        (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.25)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isClosing) {
                        (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)";
                      }
                    }}
                  >
                    {isClosing ? txMsg || "Closing..." : "CLOSE"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: T.text }}>
          OPEN ORDERS ({openOrders.length})
        </div>
        {openOrders.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: T.text3, fontSize: 11 }}>
            No open orders
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {openOrders.map((order, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: mono }}>
                        {order.coin}
                      </span>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: order.side === "A" ? "rgba(14,203,129,0.15)" : "rgba(246,70,93,0.15)",
                        color: order.side === "A" ? T.green : T.red,
                      }}>
                        {order.side === "A" ? "BUY" : "SELL"}
                      </span>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "rgba(255,255,255,0.08)",
                        color: T.text3,
                        fontFamily: mono,
                      }}>
                        {order.orderType}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: T.text3, fontFamily: mono }}>
                      ID: {order.orderId}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: mono, color: T.text }}>
                      ${order.price.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 10, color: T.text3 }}>
                  <div>
                    <span style={{ color: T.text3 }}>Size: </span>
                    <span style={{ fontFamily: mono, color: T.text2 }}>{order.size.toFixed(4)}</span>
                  </div>
                  <div>
                    <span style={{ color: T.text3 }}>Filled: </span>
                    <span style={{ fontFamily: mono, color: T.text2 }}>{order.filled.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
