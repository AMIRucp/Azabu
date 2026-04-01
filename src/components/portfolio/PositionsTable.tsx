"use client";

import { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
import { TokenIcon, ChainBadge, ProtocolBadge, formatUsd, formatPrice } from "./PortfolioCharts";
import type { UnifiedPosition } from "@/stores/usePositionStore";
import usePositionStore from "@/stores/usePositionStore";
import PositionDetail from "./PositionDetail";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { crossedThreshold } from "@/lib/tradeAnimations";

const SANS = "Inter, -apple-system, sans-serif";
const MONO = "'IBM Plex Mono', 'SF Mono', monospace";

type SortCol = "sizeUsd" | "leverage" | "unrealizedPnl" | "liquidationDistance";
type SortDir = "desc" | "asc";

function SortHeader({
  label,
  col,
  sortBy,
  sortDir,
  onClick,
  align = "left",
}: {
  label: string;
  col: SortCol;
  sortBy: SortCol;
  sortDir: SortDir;
  onClick: (col: SortCol) => void;
  align?: "left" | "right";
}) {
  return (
    <th
      onClick={() => onClick(col)}
      data-testid={`sort-header-${col}`}
      style={{
        padding: "8px 12px",
        textAlign: align,
        fontSize: 9,
        color: sortBy === col ? "#E4E4E7" : "#6B7280",
        fontWeight: 500,
        borderBottom: "1px solid #1B2030",
        cursor: "pointer",
        letterSpacing: "0.04em",
        fontFamily: MONO,
        userSelect: "none",
      }}
    >
      {label} {sortBy === col ? (sortDir === "desc" ? "\u25BC" : "\u25B2") : ""}
    </th>
  );
}

function SummaryBar() {
  const positionCount = usePositionStore((s) => s.positionCount);
  const totalPositionValue = usePositionStore((s) => s.totalPositionValue);
  const totalUnrealizedPnl = usePositionStore((s) => s.totalUnrealizedPnl);
  const totalMarginUsed = usePositionStore((s) => s.totalMarginUsed);
  const atRiskCount = usePositionStore((s) => s.atRiskCount);

  return (
    <div
      data-testid="position-summary-bar"
      style={{
        display: "flex",
        gap: 24,
        padding: "8px 12px",
        marginBottom: 8,
        background: "#000000",
        borderRadius: 6,
        fontFamily: MONO,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ fontSize: 8, color: "#6B7280", letterSpacing: "0.06em" }}>POSITIONS</div>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#E4E4E7" }}>{positionCount}</div>
      </div>
      <div>
        <div style={{ fontSize: 8, color: "#6B7280", letterSpacing: "0.06em" }}>TOTAL VALUE</div>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#E4E4E7" }}>${totalPositionValue.toFixed(0)}</div>
      </div>
      <div>
        <div style={{ fontSize: 8, color: "#6B7280", letterSpacing: "0.06em" }}>TOTAL PNL</div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 900,
            color: totalUnrealizedPnl >= 0 ? "#22C55E" : "#EF4444",
          }}
        >
          {totalUnrealizedPnl >= 0 ? "+" : ""}${totalUnrealizedPnl.toFixed(2)}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 8, color: "#6B7280", letterSpacing: "0.06em" }}>COLLATERAL (LOCKED)</div>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#E4E4E7" }}>${totalMarginUsed.toFixed(2)}</div>
      </div>
      {atRiskCount > 0 && (
        <div>
          <div style={{ fontSize: 8, color: "#EF4444", letterSpacing: "0.06em" }}>AT RISK</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#EF4444" }}>{atRiskCount}</div>
        </div>
      )}
    </div>
  );
}

function fmtP(n: number): string {
  if (n > 1000) return `$${n.toFixed(0)}`;
  if (n > 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

interface CloseConfirmProps {
  pos: UnifiedPosition;
  fraction: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function CloseConfirmDialog({ pos, fraction, onConfirm, onCancel, loading }: CloseConfirmProps) {
  const pctLabel = fraction === 1 ? "100%" : `${(fraction * 100).toFixed(0)}%`;
  const closeSize = (pos.sizeBase * fraction).toFixed(4);
  const closeUsd = (pos.sizeUsd * fraction).toFixed(2);
  const estPnl = (pos.unrealizedPnl * fraction).toFixed(2);

  return (
    <div style={{
      padding: "10px 12px",
      background: "rgba(239,68,68,0.04)",
      border: "1px solid rgba(239,68,68,0.12)",
      borderRadius: 6,
      fontFamily: MONO,
      marginTop: 4,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#E4E4E7", marginBottom: 6 }}>
        Close {pctLabel} of {pos.side} {closeSize} {pos.baseAsset} at market?
      </div>
      <div style={{ fontSize: 9, color: "#71717A", marginBottom: 4 }}>
        Size: ${closeUsd} | Est. PnL: <span style={{ color: pos.unrealizedPnl >= 0 ? "#22C55E" : "#EF4444" }}>{pos.unrealizedPnl >= 0 ? "+" : ""}${estPnl}</span>
      </div>
      <div style={{ fontSize: 8, color: "#6B7280", marginBottom: 8 }}>
        Market orders may experience slippage
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={onConfirm}
          disabled={loading}
          data-testid={`button-confirm-close-${pos.id}`}
          style={{
            padding: "6px 14px", fontSize: 10, fontWeight: 800,
            background: loading ? "rgba(239,68,68,0.3)" : "#EF4444",
            border: "none", color: "#fff", borderRadius: 4,
            cursor: loading ? "default" : "pointer", fontFamily: MONO,
            display: "flex", alignItems: "center", gap: 4,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading && <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />}
          {loading ? "Closing..." : "Confirm Close"}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          data-testid={`button-cancel-close-${pos.id}`}
          style={{
            padding: "6px 14px", fontSize: 10, fontWeight: 600,
            background: "transparent", border: "1px solid #1B2030",
            color: "#71717A", borderRadius: 4, cursor: "pointer",
            fontFamily: MONO,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function PositionsTable({
  filter = "all",
  showSummary = true,
}: {
  filter?: string;
  showSummary?: boolean;
}) {
  const isMobile = useIsMobile(640);
  const positions = usePositionStore((s) => s.positions);
  const isLoading = usePositionStore((s) => s.isLoading);
  const removePosition = usePositionStore((s) => s.removePosition);
  const [sortBy, setSortBy] = useState<SortCol>("sizeUsd");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState<{ posId: string; fraction: number } | null>(null);
  const [closeResult, setCloseResult] = useState<{ posId: string; success: boolean; message: string } | null>(null);

  function toggleSort(col: SortCol) {
    if (sortBy === col) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortBy(col);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    let list = positions;
    if (filter !== "all") {
      list = list.filter(
        (p) =>
          p.chain === filter ||
          p.protocol === filter ||
          p.type === filter
      );
    }
    return [...list].sort((a, b) => {
      const av = a[sortBy] || 0;
      const bv = b[sortBy] || 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [positions, filter, sortBy, sortDir]);

  const handleToggle = useCallback((posId: string) => {
    setExpandedId(prev => prev === posId ? null : posId);
  }, []);

  const handleCloseRequest = useCallback((pos: UnifiedPosition, fraction: number) => {
    setConfirmClose({ posId: pos.id, fraction });
    setCloseResult(null);
  }, []);

  const handleCloseConfirm = useCallback(async (pos: UnifiedPosition, fraction: number) => {
    setClosingId(pos.id);
    setCloseResult(null);

    try {
      if (pos.protocol === "aster") {
        const asterUserId = typeof window !== "undefined" ? localStorage.getItem("aster_user_id") : null;
        if (!asterUserId) throw new Error("Aster account not connected");

        const closeQty = (pos.sizeBase * fraction).toString();
        const res = await fetch("/api/aster/close-position", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: asterUserId,
            symbol: `${pos.baseAsset}USDT`,
            side: pos.side === "LONG" ? "SELL" : "BUY",
            quantity: closeQty,
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Failed to close");

        const estPnl = (pos.unrealizedPnl * fraction).toFixed(2);
        setCloseResult({ posId: pos.id, success: true, message: `Position closed. ${pos.unrealizedPnl >= 0 ? "+" : ""}$${estPnl} realized.` });
        if (fraction === 1) {
          removePosition(pos.id);
        }
      } else {
        throw new Error(`Close not supported for ${pos.protocol}`);
      }
    } catch (err) {
      console.error("[Positions] Close error:", err);
      const msg = err instanceof Error ? err.message : "Failed to close position";
      setCloseResult({ posId: pos.id, success: false, message: msg });
    }

    setClosingId(null);
    setConfirmClose(null);
  }, [removePosition]);

  const handleClose = useCallback((pos: UnifiedPosition, fraction: number) => {
    if (fraction < 0) {
      setConfirmClose(null);
      return;
    }
    handleCloseRequest(pos, fraction);
  }, [handleCloseRequest]);

  const headers = (
    <tr style={{ background: "#000000" }}>
      <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, color: "#6B7280", fontWeight: 500, borderBottom: "1px solid #1B2030", letterSpacing: "0.04em", fontFamily: MONO }}>SYMBOL</th>
      <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, color: "#6B7280", fontWeight: 500, borderBottom: "1px solid #1B2030", letterSpacing: "0.04em", fontFamily: MONO }}>SIDE</th>
      <SortHeader label="LEV" col="leverage" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} />
      <SortHeader label="SIZE" col="sizeUsd" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} align="right" />
      <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 9, color: "#6B7280", fontWeight: 500, borderBottom: "1px solid #1B2030", letterSpacing: "0.04em", fontFamily: MONO }}>ENTRY</th>
      <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 9, color: "#6B7280", fontWeight: 500, borderBottom: "1px solid #1B2030", letterSpacing: "0.04em", fontFamily: MONO }}>MARK</th>
      <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 9, color: "#6B7280", fontWeight: 500, borderBottom: "1px solid #1B2030", letterSpacing: "0.04em", fontFamily: MONO }}>LIQ</th>
      <SortHeader label="PNL" col="unrealizedPnl" sortBy={sortBy} sortDir={sortDir} onClick={toggleSort} align="right" />
      <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 9, color: "#6B7280", fontWeight: 500, borderBottom: "1px solid #1B2030", letterSpacing: "0.04em", fontFamily: MONO }}>COLLATERAL</th>
      <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, color: "#6B7280", fontWeight: 500, borderBottom: "1px solid #1B2030", letterSpacing: "0.04em", fontFamily: MONO }}>PROTOCOL</th>
      <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 9, color: "#6B7280", fontWeight: 500, borderBottom: "1px solid #1B2030", letterSpacing: "0.04em", fontFamily: MONO }}></th>
    </tr>
  );

  return (
    <div style={{ fontFamily: MONO, fontSize: 11 }}>
      {showSummary && <SummaryBar />}

      {closeResult && (
        <div
          data-testid={`close-result-${closeResult.posId}`}
          style={{
            padding: "8px 12px",
            marginBottom: 8,
            borderRadius: 6,
            fontSize: 11,
            fontFamily: MONO,
            background: closeResult.success ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
            border: `1px solid ${closeResult.success ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
            color: closeResult.success ? "#22C55E" : "#EF4444",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{closeResult.message}</span>
          <button
            onClick={() => setCloseResult(null)}
            style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 10, fontFamily: MONO }}
          >
            Dismiss
          </button>
        </div>
      )}

      {isMobile ? (
        <div data-testid="positions-mobile-cards">
          {isLoading && filtered.length === 0 && (
            <div style={{ padding: 16 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12, padding: "12px 0",
                  borderBottom: i < 2 ? "1px solid #111520" : "none",
                  alignItems: "center",
                }}>
                  <div className="pos-shimmer" style={{ width: 28, height: 28, borderRadius: "50%", background: "#151517" }} />
                  <div style={{ flex: 1 }}>
                    <div className="pos-shimmer" style={{ height: 12, width: "50%", borderRadius: 4, background: "#151517", marginBottom: 6 }} />
                    <div className="pos-shimmer" style={{ height: 9, width: "30%", borderRadius: 3, background: "#111520" }} />
                  </div>
                  <div className="pos-shimmer" style={{ height: 12, width: 60, borderRadius: 4, background: "#151517" }} />
                </div>
              ))}
              <style>{`
                .pos-shimmer { position: relative; overflow: hidden; }
                .pos-shimmer::after {
                  content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%);
                  animation: posShimmer 1.8s ease-in-out infinite;
                }
                @keyframes posShimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
              `}</style>
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#6B7280", fontSize: 13, fontFamily: SANS }}>
              No open positions
            </div>
          )}
          {filtered.map((pos) => (
            <MobilePositionCard
              key={pos.id}
              pos={pos}
              isExpanded={expandedId === pos.id}
              onToggle={handleToggle}
              onClose={handleClose}
              onCloseConfirm={handleCloseConfirm}
              closingId={closingId}
              confirmClose={confirmClose}
            />
          ))}
        </div>
      ) : (
        <div style={{ borderRadius: 8, border: "1px solid #1B2030", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>{headers}</thead>
            <tbody>
              {isLoading && filtered.length === 0 && (
                <>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <tr key={`skel-${i}`}>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td key={j} style={{ padding: "12px 8px" }}>
                          <div className="pos-shimmer" style={{
                            height: 12, width: j === 0 ? 60 : j < 3 ? 50 : 70,
                            borderRadius: 4, background: "#151517",
                          }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr><td colSpan={11} style={{ padding: 0, border: "none" }}>
                    <style>{`
                      .pos-shimmer { position: relative; overflow: hidden; }
                      .pos-shimmer::after {
                        content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%);
                        animation: posShimmer 1.8s ease-in-out infinite;
                      }
                      @keyframes posShimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                    `}</style>
                  </td></tr>
                </>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: 40, textAlign: "center", color: "#6B7280", fontSize: 13, fontFamily: SANS }}>
                    No open positions
                  </td>
                </tr>
              )}
              {filtered.map((pos) => (
                <PositionRow
                  key={pos.id}
                  pos={pos}
                  isExpanded={expandedId === pos.id}
                  onToggle={handleToggle}
                  onClose={handleClose}
                  onCloseConfirm={handleCloseConfirm}
                  closingId={closingId}
                  confirmClose={confirmClose}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const MobilePositionCard = memo(function MobilePositionCard({
  pos, isExpanded, onToggle, onClose, onCloseConfirm, closingId, confirmClose,
}: {
  pos: UnifiedPosition; isExpanded: boolean;
  onToggle: (posId: string) => void;
  onClose: (pos: UnifiedPosition, fraction: number) => void;
  onCloseConfirm: (pos: UnifiedPosition, fraction: number) => void;
  closingId: string | null;
  confirmClose: { posId: string; fraction: number } | null;
}) {
  const isClosing = closingId === pos.id;
  const showConfirm = confirmClose?.posId === pos.id;
  const pnlColor = pos.unrealizedPnl >= 0 ? "#22C55E" : "#EF4444";
  const sideColor = pos.side === "LONG" ? "#22C55E" : "#EF4444";
  const liqDanger = pos.isCritical || pos.isAtRisk;
  const pnlRef = useRef<HTMLDivElement>(null);
  const prevPnlRef = useRef(pos.unrealizedPnl);
  useEffect(() => {
    if (crossedThreshold(prevPnlRef.current, pos.unrealizedPnl) && pnlRef.current) {
      pnlRef.current.classList.add('pnl-pulse');
      const t = setTimeout(() => pnlRef.current?.classList.remove('pnl-pulse'), 400);
      return () => clearTimeout(t);
    }
    prevPnlRef.current = pos.unrealizedPnl;
  }, [pos.unrealizedPnl]);
  const liqPulseSpeed = pos.isCritical ? '0.5s' : pos.isAtRisk ? '1.2s' : '2s';
  return (
    <div data-testid={`position-card-${pos.id}`} style={{ marginBottom: 6 }}>
      <div
        className={liqDanger ? 'position-liq-danger' : ''}
        onClick={() => onToggle(pos.id)}
        style={{
          padding: '10px 12px', borderRadius: 8,
          border: '1px solid #1B2030', cursor: 'pointer',
          background: pos.isCritical ? 'rgba(239,68,68,0.03)' : pos.isAtRisk ? 'rgba(212,165,116,0.02)' : '#0B0F14',
          ...(liqDanger ? { '--pulse-speed': liqPulseSpeed } as React.CSSProperties : {}),
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {(
              <TokenIcon symbol={pos.baseAsset} />
            )}
            <div>
              <span style={{ color: '#E4E4E7', fontWeight: 700, fontSize: 12, fontFamily: MONO }}>{pos.baseAsset}</span>
              <span style={{ color: sideColor, fontSize: 9, fontWeight: 900, marginLeft: 6, fontFamily: MONO }}>{pos.side}</span>
              <span style={{ color: '#71717A', fontSize: 9, marginLeft: 6, fontFamily: MONO }}>{pos.leverage}x</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div ref={pnlRef} style={{ color: pnlColor, fontWeight: 900, fontSize: 13, fontFamily: MONO }}>
              {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
            </div>
            <div style={{ color: pos.unrealizedPnlPercent >= 0 ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)', fontSize: 8, fontFamily: MONO }}>
              {pos.unrealizedPnlPercent >= 0 ? '+' : ''}{pos.unrealizedPnlPercent.toFixed(1)}% ROE
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, fontSize: 9, fontFamily: MONO }}>
          <div>
            <div style={{ color: '#6B7280', fontSize: 8 }}>SIZE</div>
            <div style={{ color: '#E4E4E7', fontWeight: 700 }}>${pos.sizeUsd.toFixed(0)}</div>
          </div>
          <div>
            <div style={{ color: '#6B7280', fontSize: 8 }}>ENTRY</div>
            <div style={{ color: '#71717A' }}>{fmtP(pos.entryPrice)}</div>
          </div>
          <div>
            <div style={{ color: '#6B7280', fontSize: 8 }}>MARK</div>
            <div style={{ color: '#E4E4E7', fontWeight: 600 }}>{fmtP(pos.markPrice)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ProtocolBadge protocol={pos.protocol} />
            <ChainBadge chain={pos.chain} />
            {pos.liquidationPrice > 0 && (
              <span style={{
                fontSize: 8, fontFamily: MONO,
                color: pos.isCritical ? '#EF4444' : pos.isAtRisk ? '#D4A574' : '#6B7280',
              }}>
                LIQ {fmtP(pos.liquidationPrice)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              data-compact
              onClick={(e) => { e.stopPropagation(); onClose(pos, 0.5); }}
              disabled={isClosing}
              data-testid={`button-close-50-${pos.id}`}
              style={{
                padding: '4px 8px', fontSize: 8, fontWeight: 700,
                background: 'transparent', border: '1px solid #1B2030',
                color: '#6B7280', borderRadius: 4, cursor: 'pointer', fontFamily: MONO,
              }}
            >50%</button>
            <button
              data-compact
              onClick={(e) => { e.stopPropagation(); onClose(pos, 1); }}
              disabled={isClosing}
              data-testid={`button-close-${pos.id}`}
              style={{
                padding: '4px 8px', fontSize: 8, fontWeight: 800,
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                color: '#EF4444', borderRadius: 4, cursor: 'pointer', fontFamily: MONO,
                display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              {isClosing && <Loader2 style={{ width: 8, height: 8, animation: 'spin 1s linear infinite' }} />}
              CLOSE
            </button>
          </div>
        </div>
      </div>
      {showConfirm && (
        <div style={{ padding: '0 4px 4px' }}>
          <CloseConfirmDialog
            pos={pos}
            fraction={confirmClose!.fraction}
            onConfirm={() => onCloseConfirm(pos, confirmClose!.fraction)}
            onCancel={() => onClose(pos, -1)}
            loading={isClosing}
          />
        </div>
      )}
      {isExpanded && (
        <div style={{ padding: '0 4px 4px' }}>
          <PositionDetail pos={pos} onClose={onClose} />
        </div>
      )}
    </div>
  );
}, positionRowEqual);

function positionRowEqual(
  prev: { pos: UnifiedPosition; isExpanded: boolean; closingId: string | null; confirmClose: { posId: string; fraction: number } | null },
  next: { pos: UnifiedPosition; isExpanded: boolean; closingId: string | null; confirmClose: { posId: string; fraction: number } | null },
) {
  if (prev.isExpanded !== next.isExpanded) return false;
  if (prev.closingId !== next.closingId) return false;
  if (prev.confirmClose?.posId !== next.confirmClose?.posId || prev.confirmClose?.fraction !== next.confirmClose?.fraction) return false;
  const a = prev.pos, b = next.pos;
  return a.id === b.id && a.markPrice === b.markPrice && a.unrealizedPnl === b.unrealizedPnl
    && a.sizeUsd === b.sizeUsd && a.leverage === b.leverage && a.liquidationDistance === b.liquidationDistance
    && a.isAtRisk === b.isAtRisk && a.isCritical === b.isCritical && a.side === b.side;
}

const PositionRow = memo(function PositionRow({
  pos,
  isExpanded,
  onToggle,
  onClose,
  onCloseConfirm,
  closingId,
  confirmClose,
}: {
  pos: UnifiedPosition;
  isExpanded: boolean;
  onToggle: (posId: string) => void;
  onClose: (pos: UnifiedPosition, fraction: number) => void;
  onCloseConfirm: (pos: UnifiedPosition, fraction: number) => void;
  closingId: string | null;
  confirmClose: { posId: string; fraction: number } | null;
}) {
  const isClosing = closingId === pos.id;
  const showConfirm = confirmClose?.posId === pos.id;
  const [hovered, setHovered] = useState(false);
  const liqDanger = pos.isCritical || pos.isAtRisk;
  const liqPulseSpeed = pos.isCritical ? '0.5s' : pos.isAtRisk ? '1.2s' : '2s';

  const bgColor = pos.isCritical
    ? "rgba(239,68,68,0.03)"
    : pos.isAtRisk
      ? "rgba(212,165,116,0.02)"
      : hovered
        ? "rgba(255,255,255,0.02)"
        : "transparent";

  return (
    <>
      <tr
        className={liqDanger ? 'position-liq-danger' : ''}
        onClick={() => onToggle(pos.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        data-testid={`position-row-${pos.id}`}
        style={{
          cursor: "pointer",
          borderBottom: "1px solid rgba(28,28,30,0.12)",
          background: bgColor,
          transition: "background 0.15s",
          ...(liqDanger ? { '--pulse-speed': liqPulseSpeed } as React.CSSProperties : {}),
        }}
      >
        <td style={{ padding: "8px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {(
              <TokenIcon symbol={pos.baseAsset} />
            )}
            <div>
              <div style={{ color: "#E4E4E7", fontWeight: 700, fontSize: 11 }}>{pos.baseAsset}</div>
            </div>
          </div>
        </td>

        <td style={{ padding: "8px 12px" }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: pos.side === "LONG" ? "#22C55E" : "#EF4444",
            }}
          >
            {pos.side}
          </span>
        </td>

        <td style={{ padding: "8px 12px" }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color:
                pos.leverage >= 100
                  ? "#EF4444"
                  : pos.leverage >= 50
                    ? "#D4A574"
                    : "#E4E4E7",
            }}
          >
            {pos.leverage}x
          </span>
        </td>

        <td style={{ padding: "8px 12px", textAlign: "right" }}>
          <div style={{ color: "#E4E4E7", fontWeight: 700 }}>${pos.sizeUsd.toFixed(0)}</div>
          <div style={{ fontSize: 8, color: "#6B7280" }}>
            {pos.sizeBase.toFixed(4)} {pos.baseAsset}
          </div>
        </td>

        <td style={{ padding: "8px 12px", textAlign: "right", color: "#71717A", fontSize: 10 }}>
          {fmtP(pos.entryPrice)}
        </td>

        <td style={{ padding: "8px 12px", textAlign: "right", color: "#E4E4E7", fontSize: 10, fontWeight: 600 }}>
          {fmtP(pos.markPrice)}
        </td>

        <td
          style={{
            padding: "8px 12px",
            textAlign: "right",
            fontSize: 10,
            color: pos.isCritical
              ? "#EF4444"
              : pos.isAtRisk
                ? "#D4A574"
                : "rgba(113,113,122,0.5)",
            fontWeight: pos.isAtRisk ? 700 : 400,
          }}
        >
          {pos.liquidationPrice > 0 ? fmtP(pos.liquidationPrice) : "--"}
        </td>

        <td style={{ padding: "8px 12px", textAlign: "right" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: pos.unrealizedPnl >= 0 ? "#22C55E" : "#EF4444",
            }}
          >
            {pos.unrealizedPnl >= 0 ? "+" : ""}${pos.unrealizedPnl.toFixed(2)}
          </div>
          <div
            style={{
              fontSize: 8,
              color:
                pos.unrealizedPnlPercent >= 0
                  ? "rgba(34,197,94,0.5)"
                  : "rgba(239,68,68,0.5)",
            }}
          >
            {pos.unrealizedPnlPercent >= 0 ? "+" : ""}
            {pos.unrealizedPnlPercent.toFixed(1)}% ROE
          </div>
        </td>

        <td style={{ padding: "8px 12px", textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#EF4444", fontFamily: "'IBM Plex Mono', monospace" }}>
            ${pos.margin.toFixed(2)}
          </div>
          <div style={{ fontSize: 7, color: "#71717A" }}>locked</div>
        </td>

        <td style={{ padding: "8px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            <ProtocolBadge protocol={pos.protocol} />
            <ChainBadge chain={pos.chain} />
          </div>
        </td>

        <td style={{ padding: "8px 12px", textAlign: "right" }}>
          <div style={{ display: "flex", gap: 3, justifyContent: "flex-end" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(pos, 1);
              }}
              disabled={isClosing}
              data-testid={`button-close-${pos.id}`}
              style={{
                padding: "3px 6px",
                fontSize: 8,
                fontWeight: 800,
                background: isClosing ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.15)",
                color: "#EF4444",
                borderRadius: 3,
                cursor: isClosing ? "default" : "pointer",
                fontFamily: MONO,
                opacity: isClosing ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              {isClosing && <Loader2 style={{ width: 8, height: 8, animation: "spin 1s linear infinite" }} />}
              CLOSE
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(pos, 0.5);
              }}
              disabled={isClosing}
              data-testid={`button-close-50-${pos.id}`}
              style={{
                padding: "3px 5px",
                fontSize: 7,
                background: "transparent",
                border: "1px solid #1B2030",
                color: "#6B7280",
                borderRadius: 3,
                cursor: isClosing ? "default" : "pointer",
                fontFamily: MONO,
                opacity: isClosing ? 0.6 : 1,
              }}
            >
              50%
            </button>
          </div>
        </td>
      </tr>
      {showConfirm && (
        <tr>
          <td colSpan={11} style={{ padding: "0 12px 8px" }}>
            <CloseConfirmDialog
              pos={pos}
              fraction={confirmClose!.fraction}
              onConfirm={() => onCloseConfirm(pos, confirmClose!.fraction)}
              onCancel={() => onClose(pos, -1)}
              loading={isClosing}
            />
          </td>
        </tr>
      )}
      {isExpanded && (
        <tr>
          <td colSpan={11} style={{ padding: 0 }}>
            <PositionDetail pos={pos} onClose={onClose} />
          </td>
        </tr>
      )}
    </>
  );
}, positionRowEqual);
