"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { BridgeEvmChain, BridgeToken } from "@/config/bridgeEvmChains";
import { CARD, BORDER, LABEL, DIM, BRIGHT, MONO, CARD_SHADOW } from "./swapConstants";

export function BridgePanel({
  label,
  chain,
  chains,
  onSelectChain,
  token,
  amount,
  balance,
  loading,
  readOnly,
  disabled,
  onAmountChange,
  onSelectToken,
  onSetMax,
  testIdPrefix,
}: {
  label: string;
  chain: BridgeEvmChain;
  chains: BridgeEvmChain[];
  onSelectChain: (c: BridgeEvmChain) => void;
  token: BridgeToken;
  amount: string;
  balance: number | null;
  loading?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  onAmountChange?: (v: string) => void;
  onSelectToken: () => void;
  onSetMax?: () => void;
  testIdPrefix: string;
}) {
  const balNum =
    balance != null ? balance.toLocaleString(undefined, { maximumFractionDigits: 6 }) : null;
  const hasAmount = parseFloat(amount) > 0;

  return (
    <div
      style={{
        borderRadius: 16,
        background: CARD,
        border: `1px solid ${BORDER}`,
        boxShadow: CARD_SHADOW,
        padding: "16px 18px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 12, color: LABEL, fontFamily: "'Inter', system-ui, sans-serif" }}>
          {label}
        </span>
        <ChainDropdown
          chain={chain}
          chains={chains}
          onSelect={onSelectChain}
          testId={`${testIdPrefix}-chain`}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          data-testid={`button-select-${testIdPrefix}-token`}
          onClick={onSelectToken}
          disabled={disabled}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
            background: "rgba(255,255,255,0.05)",
            border: "none",
            borderRadius: 50,
            padding: "7px 12px 7px 8px",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {token.logoURI ? (
            <img
              src={token.logoURI}
              alt={token.symbol}
              style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: DIM,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 9, color: LABEL, fontFamily: MONO }}>{token.symbol.slice(0, 2)}</span>
            </div>
          )}
          <span style={{ fontSize: 15, fontWeight: 700, color: BRIGHT, fontFamily: "'Inter', system-ui, sans-serif" }}>
            {token.symbol}
          </span>
          <ChevronDown size={13} color={LABEL} />
        </button>

        <div style={{ flex: 1, textAlign: "right" }}>
          {readOnly || loading ? (
            loading ? (
              <span style={{ fontSize: 32, fontWeight: 300, fontFamily: MONO, color: DIM }}>…</span>
            ) : (
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 300,
                  fontFamily: MONO,
                  letterSpacing: "-0.03em",
                  color: hasAmount ? "#9BA4AE" : DIM,
                }}
              >
                {hasAmount ? amount : "0.00"}
              </span>
            )
          ) : (
            <input
              data-testid={`input-${testIdPrefix}-amount`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              disabled={disabled}
              value={amount}
              onChange={(e) => onAmountChange?.(e.target.value.replace(/[^0-9.]/g, ""))}
              className="swp-input"
              style={{
                width: "100%",
                textAlign: "right",
                fontSize: 32,
                fontWeight: 300,
                fontFamily: MONO,
                letterSpacing: "-0.03em",
                color: hasAmount ? BRIGHT : DIM,
                background: "transparent",
                border: "none",
                outline: "none",
                padding: 0,
              }}
            />
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <span style={{ fontSize: 11, color: DIM, fontFamily: MONO }} />
        {balNum != null ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: LABEL, fontFamily: MONO }}>Balance: {balNum}</span>
            {onSetMax && balance != null && balance > 0 && !readOnly && (
              <button
                type="button"
                data-testid={`button-max-${testIdPrefix}`}
                onClick={onSetMax}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#D4A574",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  padding: 0,
                }}
              >
                Max
              </button>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 11, color: DIM, fontFamily: MONO }}>Balance: —</span>
        )}
      </div>
    </div>
  );
}

function ChainDropdown({
  chain,
  chains,
  onSelect,
  testId,
}: {
  chain: BridgeEvmChain;
  chains: BridgeEvmChain[];
  onSelect: (c: BridgeEvmChain) => void;
  testId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        data-testid={testId}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px 5px 6px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${BORDER}`,
          cursor: "pointer",
        }}
      >
        <img
          src={chain.logo}
          alt=""
          style={{ width: 14, height: 14, borderRadius: "50%" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 600, color: BRIGHT }}>{chain.label}</span>
        <ChevronDown size={12} color={LABEL} />
      </button>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              right: 0,
              zIndex: 50,
              minWidth: 168,
              maxHeight: 280,
              overflowY: "auto",
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
            }}
          >
            {chains.map((c) => {
              const active = c.chainId === chain.chainId;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    onSelect(c);
                    setOpen(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 12px",
                    border: "none",
                    background: active ? "rgba(212,165,116,0.1)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <img src={c.logo} alt="" style={{ width: 16, height: 16, borderRadius: "50%" }} />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: active ? "#D4A574" : BRIGHT,
                    }}
                  >
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
