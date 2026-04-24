"use client";

import { ArrowDown, X } from "lucide-react";
import { MONO, SANS, CARD, BORDER, LABEL, DIM, BRIGHT, ORANGE, CARD_SHADOW, FUSION_PRESET_OPTIONS, type FusionPreset } from "./swapConstants";
import type { TokenState } from "./swapConstants";

interface SwapPreviewModalProps {
  fromToken: TokenState;
  toToken: TokenState;
  fromAmount: string;
  toAmount: string;
  rate: string;
  preset: FusionPreset;
  onConfirm: () => void;
  onClose: () => void;
}

export function SwapPreviewModal({
  fromToken, toToken, fromAmount, toAmount, rate, preset, onConfirm, onClose,
}: SwapPreviewModalProps) {
  const presetInfo = FUSION_PRESET_OPTIONS.find(p => p.key === preset);
  const minReceived = (parseFloat(toAmount.replace(/,/g, "")) * 0.995) // Conservative 0.5% for display
    .toLocaleString(undefined, { maximumFractionDigits: 6 });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.72)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420,
          background: "#0A0C10",
          border: `1px solid ${BORDER}`,
          borderRadius: "24px 24px 0 0",
          padding: "24px 20px 32px",
          boxShadow: CARD_SHADOW,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: BRIGHT, fontFamily: SANS }}>Review swap</span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: LABEL, display: "flex", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* From */}
        <TokenRow token={fromToken} amount={fromAmount} label="You pay" />

        {/* Arrow */}
        <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "#13161C", border: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ArrowDown size={14} color={LABEL} />
          </div>
        </div>

        {/* To */}
        <TokenRow token={toToken} amount={toAmount} label="You receive" highlight />

        {/* Details */}
        <div style={{
          marginTop: 16, borderRadius: 14,
          background: CARD, border: `1px solid ${BORDER}`,
          overflow: "hidden",
        }}>
          <Row label="Rate" value={`1 ${fromToken.symbol} = ${rate} ${toToken.symbol}`} />
          <Row label="Min. received" value={`${minReceived} ${toToken.symbol}`} />
          <Row label="Speed" value={presetInfo?.label || preset} last />
        </div>

        {/* Confirm button */}
        <button
          onClick={onConfirm}
          style={{
            width: "100%", marginTop: 16, padding: "16px",
            borderRadius: 16, border: "none",
            background: ORANGE, color: "#fff",
            fontSize: 15, fontWeight: 700, fontFamily: SANS,
            cursor: "pointer", letterSpacing: "0.01em",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          Confirm swap
        </button>
      </div>
    </div>
  );
}

function TokenRow({ token, amount, label, highlight }: {
  token: TokenState; amount: string; label: string; highlight?: boolean;
}) {
  return (
    <div style={{
      borderRadius: 16, background: CARD, border: `1px solid ${BORDER}`,
      padding: "14px 16px",
    }}>
      <div style={{ fontSize: 11, color: LABEL, fontFamily: SANS, marginBottom: 10 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {token.logoURI ? (
            <img src={token.logoURI} alt={token.symbol}
              style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: DIM, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 10, color: LABEL, fontFamily: MONO }}>{token.symbol.slice(0, 2)}</span>
            </div>
          )}
          <span style={{ fontSize: 16, fontWeight: 700, color: BRIGHT, fontFamily: SANS }}>{token.symbol}</span>
        </div>
        <span style={{
          fontSize: 28, fontWeight: 300, fontFamily: MONO, letterSpacing: "-0.03em",
          color: highlight ? BRIGHT : "#9BA4AE",
        }}>
          {amount}
        </span>
      </div>
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "11px 14px",
      borderBottom: last ? "none" : `1px solid ${BORDER}`,
    }}>
      <span style={{ fontSize: 12, color: LABEL, fontFamily: SANS }}>{label}</span>
      <span style={{ fontSize: 12, color: BRIGHT, fontFamily: MONO }}>{value}</span>
    </div>
  );
}
