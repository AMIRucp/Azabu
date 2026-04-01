"use client";

import { memo, useState } from "react";
import { ArrowDown, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { TokenSelector } from "./SwapShared";
import { MONO, SANS, SLIPPAGE_PRESETS, type TokenState } from "./swapConstants";

interface SwapInputPanelProps {
  fromToken: TokenState;
  toToken: TokenState;
  fromAmount: string;
  toAmount: string;
  fromBal: number | null;
  quoting: boolean;
  flipAnim: boolean;
  onFromAmountChange: (val: string) => void;
  onFlip: () => void;
  onSetPercentage: (p: number) => void;
  onSelectFrom: () => void;
  onSelectTo: () => void;
}

export const SwapInputPanel = memo(function SwapInputPanel({
  fromToken, toToken, fromAmount, toAmount, fromBal,
  quoting, flipAnim, onFromAmountChange, onFlip,
  onSetPercentage, onSelectFrom, onSelectTo,
}: SwapInputPanelProps) {
  const numFrom = parseFloat(fromAmount) || 0;
  const toAmountNum = parseFloat(toAmount.replace(/,/g, "")) || 0;

  const fromBalStr = fromBal != null
    ? `${fromBal.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${fromToken.symbol}`
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
      <div style={{
        padding: "16px",
        borderRadius: 14,
        background: "linear-gradient(145deg, #0C0E12 0%, #0A0C10 100%)",
        border: "1px solid #181A20",
      }} data-testid="swap-input-send">
        <TokenSelector
          token={fromToken}
          onClick={onSelectFrom}
          testId="button-select-from-token"
          balance={fromBalStr}
        />

        <div style={{ marginTop: 16 }}>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={fromAmount}
            onChange={(e) => onFromAmountChange(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            className="swp-field"
            style={{
              width: "100%", background: "transparent", border: "none", outline: "none",
              color: "#E6EDF3", fontSize: 32, fontWeight: 500,
              fontFamily: SANS, letterSpacing: "-0.02em",
            }}
            data-testid="input-from-amount"
          />
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 8,
        }}>
          <span style={{ fontSize: 12, color: "#6B7280", fontFamily: MONO }}>
            {numFrom > 0 ? `~$${(numFrom).toFixed(2)}` : ""}
          </span>
          {fromBal != null && fromBal > 0 && (
            <div style={{ display: "flex", gap: 4 }}>
              {[0.25, 0.5, 1].map(p => (
                <button key={p} onClick={() => onSetPercentage(p)} data-testid={`button-pct-${p * 100}`} style={{
                  padding: "3px 8px", borderRadius: 6, border: "none",
                  background: p === 1 ? "#181A20" : "transparent",
                  color: p === 1 ? "#E6EDF3" : "#6B7280", fontSize: 11,
                  fontFamily: MONO, cursor: "pointer", transition: "color 0.12s",
                  fontWeight: p === 1 ? 600 : 400,
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#9BA4AE"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = p === 1 ? "#E6EDF3" : "#6B7280"; }}
                >
                  {p === 1 ? "Max" : `${p * 100}%`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: "flex", justifyContent: "center",
        position: "relative", height: 0, zIndex: 2,
      }}>
        <button onClick={onFlip} data-testid="button-flip-tokens" style={{
          position: "absolute", top: -18,
          width: 36, height: 36, borderRadius: 18,
          border: "2px solid #0A0C10", background: "#D4A574",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "background 0.15s, transform 0.3s",
          transform: flipAnim ? "rotate(180deg)" : "rotate(0deg)",
          color: "#FFFFFF",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#E85D24"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#D4A574"; }}
        >
          <ArrowDown style={{ width: 16, height: 16 }} />
        </button>
      </div>

      <div style={{
        padding: "16px",
        borderRadius: 14,
        background: "linear-gradient(145deg, #0C0E12 0%, #0A0C10 100%)",
        border: "1px solid #181A20",
        marginTop: 4,
      }} data-testid="swap-input-receive">
        <TokenSelector
          token={toToken}
          onClick={onSelectTo}
          testId="button-select-to-token"
        />

        <div style={{ marginTop: 16 }}>
          <span style={{
            display: "block",
            fontSize: 32, fontWeight: 500, fontFamily: SANS, letterSpacing: "-0.02em",
            color: toAmountNum > 0 ? "#9BA4AE" : "#181A20",
          }}>
            {quoting ? (
              <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 4, height: 4, borderRadius: "50%", background: "#6B7280",
                    animation: `swpPulse 1s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </span>
            ) : toAmountNum > 0 ? toAmount : "0"}
          </span>
        </div>

        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 12, color: "#6B7280", fontFamily: MONO }}>
            {toAmountNum > 0 ? `~$${toAmountNum.toFixed(2)}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
});

interface SwapDetailsProps {
  fromSymbol: string;
  toSymbol: string;
  rate: string;
  priceImpact: number | null;
  toAmountNum: number;
  slippage: number;
  routeHops: string[];
  showSlippage: boolean;
  onToggleSlippage: () => void;
  onSetSlippage: (v: number) => void;
}

export const SwapDetails = memo(function SwapDetails({
  fromSymbol, toSymbol, rate, priceImpact, toAmountNum,
  slippage, routeHops, showSlippage, onToggleSlippage, onSetSlippage,
}: SwapDetailsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      margin: "8px 0 0", borderRadius: 12,
      background: "linear-gradient(135deg, #0A0C10 0%, #0C0E12 100%)",
      border: "1px solid #181A20",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }} data-testid="swap-details">
      <button
        onClick={() => setExpanded(!expanded)}
        data-testid="button-toggle-advanced"
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 14px", background: "transparent", border: "none",
          cursor: "pointer", width: "100%",
        }}
      >
        <span style={{ fontSize: 11, color: "#6B7280", fontFamily: MONO }}>
          1 {fromSymbol} = {rate} {toSymbol}
        </span>
        <span style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 10, color: "#4A5060", fontFamily: MONO,
        }}>
          Advanced
          {expanded
            ? <ChevronUp style={{ width: 12, height: 12 }} />
            : <ChevronDown style={{ width: 12, height: 12 }} />
          }
        </span>
      </button>

      {expanded && (
        <div style={{ padding: "0 14px 10px", display: "flex", flexDirection: "column" }}>
          {priceImpact != null && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0" }}>
              <span style={{ fontSize: 11, color: "#6B7280", fontFamily: MONO }}>Price impact</span>
              <span style={{ fontSize: 11, color: priceImpact > 3 ? "#EF4444" : priceImpact > 1 ? "#D4A574" : "#9BA4AE", fontFamily: MONO }}>
                {priceImpact < 0.01 ? "<0.01%" : priceImpact.toFixed(2) + "%"}
              </span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0" }}>
            <span style={{ fontSize: 11, color: "#6B7280", fontFamily: MONO }}>Min. received</span>
            <span style={{ fontSize: 11, color: "#9BA4AE", fontFamily: MONO }}>
              {(toAmountNum * (1 - slippage / 100)).toFixed(4)} {toSymbol}
            </span>
          </div>
          {routeHops.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0" }}>
              <span style={{ fontSize: 11, color: "#6B7280", fontFamily: MONO }}>Route</span>
              <span style={{ fontSize: 11, color: "#D4A574", fontFamily: MONO }}>
                {routeHops.join(" \u2192 ")}
              </span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0" }}>
            <span style={{ fontSize: 11, color: "#6B7280", fontFamily: MONO }}>Slippage</span>
            <button onClick={(e) => { e.stopPropagation(); onToggleSlippage(); }} style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "transparent", border: "none", color: "#9BA4AE",
              fontSize: 11, fontFamily: MONO, cursor: "pointer",
            }} data-testid="button-swap-settings">
              {slippage}%
              <ChevronDown style={{ width: 10, height: 10 }} />
            </button>
          </div>
          {showSlippage && (
            <div style={{ display: "flex", gap: 4, padding: "6px 0 2px", flexWrap: "wrap" }}>
              {SLIPPAGE_PRESETS.map(v => (
                <button key={v} onClick={() => onSetSlippage(v)} style={{
                  padding: "4px 10px", borderRadius: 5, border: "none",
                  fontSize: 11, fontFamily: MONO, cursor: "pointer", transition: "all 0.12s",
                  background: slippage === v ? "#181A20" : "transparent",
                  color: slippage === v ? "#E6EDF3" : "#6B7280",
                }} data-testid={`slippage-${v}`}>{v}%</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
