"use client";

import type { UnifiedPosition } from "@/stores/usePositionStore";
import { ProtocolBadge, ChainBadge, formatUsd, formatPrice } from "./PortfolioCharts";

const MONO = "'IBM Plex Mono', 'SF Mono', monospace";
const SANS = "Inter, -apple-system, sans-serif";

function DetailRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
      <span style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS }}>{label}</span>
      <span style={{ fontSize: 10, color: color || "#E2E8F0", fontFamily: MONO, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default function PositionDetail({
  pos,
  onClose,
}: {
  pos: UnifiedPosition;
  onClose: (pos: UnifiedPosition, fraction: number) => void;
}) {
  const pnlColor = pos.unrealizedPnl >= 0 ? "#22C55E" : "#EF4444";
  const marginColor = "#EF4444";

  return (
    <div style={{
      background: "#0C0C14", borderRadius: 6, padding: 12,
      border: "1px solid #1A1A24", marginTop: 4,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <ProtocolBadge protocol={pos.protocol} />
        <ChainBadge chain={pos.chain} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <DetailRow label="Size (USD)" value={formatUsd(pos.sizeUsd)} />
        <DetailRow label="Leverage" value={`${pos.leverage}x`} />
        <DetailRow label="Entry Price" value={formatPrice(pos.entryPrice)} />
        <DetailRow label="Mark Price" value={formatPrice(pos.markPrice)} />
        <DetailRow label="Liquidation" value={pos.liquidationPrice > 0 ? formatPrice(pos.liquidationPrice) : "--"} />
        <DetailRow label="Liq Distance" value={`${pos.liquidationDistance.toFixed(1)}%`} color={pos.isAtRisk ? "#EF4444" : undefined} />
        <DetailRow label="Unrealized PnL" value={`${pos.unrealizedPnl >= 0 ? "+" : ""}$${pos.unrealizedPnl.toFixed(2)}`} color={pnlColor} />
        <DetailRow label="ROE" value={`${pos.unrealizedPnlPercent >= 0 ? "+" : ""}${pos.unrealizedPnlPercent.toFixed(1)}%`} color={pnlColor} />
        <DetailRow label="Collateral (locked)" value={`$${pos.margin.toFixed(2)}`} color={marginColor} />
        <DetailRow label="Duration" value={pos.duration} />
      </div>
    </div>
  );
}
