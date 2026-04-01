"use client";

import { useState } from "react";
import { ProtocolBadge, ChainBadge, formatUsd, PROTOCOL_COLORS } from "./PortfolioCharts";
import type { ProtocolDeposit } from "@/hooks/usePortfolioData";
import { DepositModal } from "../DepositModal";

const MONO = "'IBM Plex Mono', 'SF Mono', monospace";
const SANS = "Inter, -apple-system, sans-serif";

function UtilizationBar({ pct }: { pct: number }) {
  const color = pct > 80 ? "#EF4444" : pct > 50 ? "#D4A574" : "#22C55E";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 60, height: 4, borderRadius: 2,
        background: "#1B2030", overflow: "hidden",
      }}>
        <div style={{
          width: `${Math.min(pct, 100)}%`, height: "100%",
          background: color, borderRadius: 2,
          transition: "width 0.4s ease",
        }} />
      </div>
      <span style={{ fontSize: 10, color, fontFamily: MONO, fontWeight: 600, minWidth: 32 }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

function DepositRow({ deposit, index }: { deposit: ProtocolDeposit; index: number }) {
  const [hovered, setHovered] = useState(false);

  if (!deposit.connected) {
    return (
      <tr
        data-testid={`deposit-row-${index}`}
        style={{ borderBottom: "1px solid #0F0F12" }}
      >
        <td style={{ padding: "10px 12px" }}>
          <ProtocolBadge protocol={deposit.protocol} />
        </td>
        <td style={{ padding: "10px 12px" }}>
          <ChainBadge chain={deposit.chain} />
        </td>
        <td colSpan={4} style={{ padding: "10px 12px", textAlign: "center" }}>
          <span style={{ fontSize: 11, color: "#6B7280", fontFamily: SANS }}>Not connected</span>
        </td>
      </tr>
    );
  }

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={`deposit-row-${index}`}
      style={{
        borderBottom: "1px solid #0F0F12",
        background: hovered ? "rgba(255,255,255,0.025)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ProtocolBadge protocol={deposit.protocol} />
          <span style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS }}>({deposit.asset})</span>
        </div>
      </td>
      <td style={{ padding: "10px 12px" }}>
        <ChainBadge chain={deposit.chain} />
      </td>
      <td style={{ padding: "10px 12px", textAlign: "right" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0", fontFamily: MONO }}>
          {formatUsd(deposit.totalDeposited)}
        </span>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "right" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#22C55E", fontFamily: MONO }}>
          {formatUsd(deposit.free)}
        </span>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "right" }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#EF4444", fontFamily: MONO }}>
            {formatUsd(deposit.locked)}
          </span>
          <div style={{ fontSize: 8, color: "#71717A", fontFamily: SANS, marginTop: 1 }}>collateral</div>
        </div>
      </td>
      <td style={{ padding: "10px 12px", textAlign: "right" }}>
        <UtilizationBar pct={deposit.utilizationPct} />
      </td>
    </tr>
  );
}

const ALL_PROTOCOLS: { protocol: string; chain: "Arbitrum" | "Hyperliquid"; asset: string }[] = [
  { protocol: "Aster", chain: "Arbitrum", asset: "USDT" },
  { protocol: "Hyperliquid", chain: "Hyperliquid", asset: "USDC" },
];

export default function DepositsTab({
  deposits,
  sourceStatus,
}: {
  deposits: ProtocolDeposit[];
  sourceStatus: Record<string, string>;
}) {
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const depositMap = new Map(deposits.map(d => [d.protocol.toLowerCase(), d]));

  const rows: ProtocolDeposit[] = ALL_PROTOCOLS.map(proto => {
    const existing = depositMap.get(proto.protocol.toLowerCase());
    if (existing) return existing;
    const statusKey = proto.protocol.toLowerCase();
    const status = sourceStatus[statusKey];
    return {
      protocol: proto.protocol,
      chain: proto.chain,
      asset: proto.asset,
      totalDeposited: 0,
      free: 0,
      locked: 0,
      utilizationPct: 0,
      connected: status === "ok",
    };
  });

  return (
    <div>
      <div style={{
        margin: "0 0 12px",
        padding: "10px 14px",
        background: "#28A0F008",
        border: "1px solid #28A0F020",
        borderRadius: 6,
        fontSize: 10,
        color: "#A3A3A3",
        lineHeight: 1.6,
        fontFamily: SANS,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12,
      }}>
        <div>
          <span style={{ color: "#D4A574", fontWeight: 700 }}>INFO</span>
          <span style={{ margin: "0 8px", color: "#333" }}>|</span>
          Your Azabu trading balance across venues.
          <strong style={{ color: "#22C55E" }}> FREE MARGIN</strong> can be used to open new positions or withdrawn.
          <strong style={{ color: "#EF4444" }}> LOCKED MARGIN</strong> is collateral held against open positions.
        </div>
        <button
          data-testid="deposit-open-btn"
          onClick={() => setDepositModalOpen(true)}
          style={{
            flexShrink: 0, padding: "7px 16px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg, #D4A574, #D4551F)",
            color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: SANS,
            cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          + Deposit
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1B2030" }}>
              {["PROTOCOL", "CHAIN", "TOTAL", "FREE", "LOCKED", "UTILIZATION"].map((h, i) => (
                <th key={h} style={{
                  padding: "8px 12px", fontSize: 9, color: "#6B7280", fontWeight: 500,
                  textAlign: i <= 1 ? "left" : "right",
                  fontFamily: MONO, letterSpacing: "0.04em", borderBottom: "1px solid #1B2030",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((d, i) => <DepositRow key={d.protocol} deposit={d} index={i} />)}
          </tbody>
        </table>
      </div>

      <DepositModal open={depositModalOpen} onClose={() => setDepositModalOpen(false)} />
    </div>
  );
}
