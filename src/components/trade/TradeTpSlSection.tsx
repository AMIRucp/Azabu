"use client";

import { useState } from "react";
import TradeStepperInput from "./TradeStepperInput";

const SANS = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', monospace";

const LONG_GREEN = "#B4F4C8";
const SHORT_RED = "#F87171";
const LBL = "#888888";

export interface TradeTpSlSectionProps {
  tp: string;
  sl: string;
  onTpChange: (value: string) => void;
  onSlChange: (value: string) => void;
  tpGain: string;
  slLoss: string;
  onTpGainChange: (value: string) => void;
  onSlLossChange: (value: string) => void;
  quoteAsset: string;
  tpPnl: number;
  slPnl: number;
  defaultOpen?: boolean;
}

export default function TradeTpSlSection({
  tp,
  sl,
  onTpChange,
  onSlChange,
  tpGain,
  slLoss,
  onTpGainChange,
  onSlLossChange,
  quoteAsset,
  tpPnl,
  slPnl,
  defaultOpen = true,
}: TradeTpSlSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const isSet = Boolean(tp || sl || tpGain || slLoss);
  const statusLabel = isSet ? "Set" : "Not set";

  const stepField = (current: string, onChange: (v: string) => void, step: number) => (dir: 1 | -1) => {
    const num = parseFloat(current) || 0;
    const next = Math.max(0, num + dir * step);
    onChange(Number.isInteger(step) ? String(next) : next.toFixed(2));
  };

  const tpPnlLabel =
    tpPnl !== 0 ? `Est. PnL ${tpPnl > 0 ? "+" : ""}$${tpPnl.toFixed(2)}` : "Est. PnL —";
  const slPnlLabel = slPnl !== 0 ? `Est. PnL -$${slPnl.toFixed(2)}` : "Est. PnL —";

  const pairRow = (
    priceLabel: string,
    priceColor: string,
    priceValue: string,
    onPriceChange: (v: string) => void,
    priceTestId: string | undefined,
    pctLabel: string,
    pctColor: string,
    pctValue: string,
    onPctChange: (v: string) => void,
    pnlLabel: string,
  ) => (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 0.85fr)",
          gap: 6,
        }}
      >
        <TradeStepperInput
          label={priceLabel}
          labelColor={priceColor}
          value={priceValue}
          onChange={onPriceChange}
          unit={quoteAsset}
          onStep={stepField(priceValue, onPriceChange, 1)}
          testId={priceTestId}
        />
        <TradeStepperInput
          label={pctLabel}
          labelColor={pctColor}
          value={pctValue}
          onChange={onPctChange}
          unit="%"
          onStep={stepField(pctValue, onPctChange, 1)}
        />
      </div>
      <div
        style={{
          fontSize: 9,
          color: "#555555",
          fontFamily: MONO,
          marginTop: 4,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {pnlLabel}
      </div>
    </div>
  );

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid #1E1E1E",
        background: "rgba(255,255,255,0.02)",
        padding: "8px 10px",
        marginBottom: 10,
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <button
        type="button"
        data-testid="trade-tpsl-toggle"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 6,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: 0,
          marginBottom: open ? 8 : 0,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                fontFamily: MONO,
                color: LONG_GREEN,
                background: "rgba(180,244,200,0.12)",
                border: "1px solid rgba(180,244,200,0.25)",
                borderRadius: 4,
                padding: "2px 4px",
                flexShrink: 0,
              }}
            >
              TP
            </span>
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                fontFamily: MONO,
                color: SHORT_RED,
                background: "rgba(248,113,113,0.12)",
                border: "1px solid rgba(248,113,113,0.25)",
                borderRadius: 4,
                padding: "2px 4px",
                flexShrink: 0,
              }}
            >
              SL
            </span>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              fontFamily: SANS,
              color: "#D1D5DB",
              lineHeight: 1.2,
              textAlign: "left",
            }}
          >
            Take Profit / Stop Loss
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, paddingTop: 2 }}>
          <span style={{ fontSize: 9, color: LBL, fontFamily: MONO, whiteSpace: "nowrap" }}>{statusLabel}</span>
          <svg
            width="8"
            height="5"
            viewBox="0 0 10 6"
            fill="none"
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}
          >
            <path d="M1 1L5 5L9 1" stroke={LBL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          {pairRow("TP Price", LONG_GREEN, tp, onTpChange, "trade-tp-input", "Gain", LONG_GREEN, tpGain, onTpGainChange, tpPnlLabel)}
          {pairRow("SL Price", SHORT_RED, sl, onSlChange, "trade-sl-input", "Loss", SHORT_RED, slLoss, onSlLossChange, slPnlLabel)}
        </div>
      )}
    </div>
  );
}
