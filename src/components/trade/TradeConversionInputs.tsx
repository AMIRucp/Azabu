"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const SANS = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', monospace";

function Stepper({ onStep }: { onStep: (direction: 1 | -1) => void }) {
  const arrow = (dir: 1 | -1) => (
    <button
      type="button"
      onClick={() => onStep(dir)}
      style={{
        width: "100%",
        height: "50%",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        color: "#111111",
      }}
    >
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: dir === -1 ? "rotate(180deg)" : undefined }}>
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  return (
    <div
      style={{
        width: 22,
        height: 32,
        borderRadius: 10,
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
      }}
    >
      {arrow(1)}
      <div style={{ height: 1, background: "rgba(0,0,0,0.12)", margin: "0 6px" }} />
      {arrow(-1)}
    </div>
  );
}

export interface TradeConversionInputsProps {
  value: string;
  onChange: (value: string) => void;
  denom: "asset" | "usd";
  onDenomChange: (denom: "asset" | "usd") => void;
  assetSymbol: string;
  quoteSymbol: string;
  onStep: (direction: 1 | -1) => void;
}

export default function TradeConversionInputs({
  value,
  onChange,
  denom,
  onDenomChange,
  assetSymbol,
  quoteSymbol,
  onStep,
}: TradeConversionInputsProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeLabel = denom === "usd" ? quoteSymbol : assetSymbol;
  const options: { id: "asset" | "usd"; label: string }[] = [
    { id: "asset", label: assetSymbol },
    { id: "usd", label: quoteSymbol },
  ];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div data-testid="trade-conversion-inputs" ref={rootRef} style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          borderRadius: 12,
          background: "linear-gradient(180deg, rgba(38,38,38,0.95) 0%, rgba(24,24,24,0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <input
          data-testid="trade-size-input"
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 18,
            lineHeight: 1.2,
            fontFamily: MONO,
            fontWeight: 600,
            color: "#D1D5DB",
            letterSpacing: "-0.02em",
          }}
        />

        <Stepper onStep={onStep} />

        <button
          type="button"
          data-testid="trade-size-denom-toggle"
          onClick={() => setOpen((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: SANS,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {activeLabel}
          <ChevronDown
            size={14}
            strokeWidth={2.25}
            style={{
              color: "#9CA3AF",
              transform: open ? "rotate(180deg)" : undefined,
              transition: "transform 0.15s",
            }}
          />
        </button>
      </div>

      {open && (
        <div
          data-testid="trade-size-denom-menu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 12,
            minWidth: 120,
            borderRadius: 12,
            background: "#1A1A1A",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
            overflow: "hidden",
            zIndex: 20,
          }}
        >
          {options.map((opt) => {
            const active = denom === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                data-testid={`trade-size-denom-${opt.id}`}
                onClick={() => {
                  onDenomChange(opt.id);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  color: active ? "#FFFFFF" : "#9CA3AF",
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  fontFamily: SANS,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
