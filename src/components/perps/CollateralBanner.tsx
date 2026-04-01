"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, X, ArrowRightLeft, Wallet, ArrowDownToLine } from "lucide-react";

const mono = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

interface CollateralBannerProps {
  token: string;
  chainLabel: string;
  deficit: number;
  balance: number | null;
  loading: boolean;
  onGetToken: () => void;
  onDeposit?: () => void;
  protocolName?: string;
  onNavigateToBridge?: (amount: number) => void;
  onConnectArbitrum?: () => void;
  arbitrumBalance?: number | null;
  hyperliquidBalance?: number | null;
  bridgeNeeded?: boolean;
  bridgeAmount?: number;
  isArbitrum?: boolean;
  isEvm?: boolean;
  evmConnected?: boolean;
}

export default function CollateralBanner({
  token, chainLabel, deficit, balance, loading, onGetToken, onDeposit, protocolName, onNavigateToBridge, onConnectArbitrum,
  arbitrumBalance, hyperliquidBalance, bridgeNeeded, bridgeAmount, isArbitrum, isEvm, evmConnected,
}: CollateralBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || loading) return null;

  const needsEvm = isEvm || isArbitrum;

  if (needsEvm && !evmConnected) {
    return (
      <div
        data-testid="collateral-banner-connect-arb"
        style={{
          padding: "10px 12px",
          borderRadius: 6,
          marginBottom: 10,
          background: "rgba(40,160,240,0.06)",
          border: "1px solid rgba(40,160,240,0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
          <Wallet style={{ width: 12, height: 12, color: "#28A0F0", flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 10, color: "#e4e4ec", fontFamily: mono, fontWeight: 600, lineHeight: 1.4, marginBottom: 2 }}>
              EVM wallet required
            </div>
            <div style={{ fontSize: 9, color: "#7a7a90", fontFamily: mono, lineHeight: 1.5 }}>
              Connect an EVM wallet (MetaMask, Rabby, or Coinbase Wallet) to trade on {chainLabel}.
            </div>
          </div>
        </div>
        {onConnectArbitrum && (
          <button
            data-testid="collateral-banner-connect-arb-btn"
            onClick={onConnectArbitrum}
            style={{
              width: "100%", padding: "8px 0", borderRadius: 5,
              border: "1px solid rgba(40,160,240,0.25)",
              background: "rgba(40,160,240,0.08)",
              color: "#28A0F0", fontSize: 10, fontWeight: 700, fontFamily: mono,
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6, letterSpacing: "0.04em",
              transition: "opacity 0.12s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Connect EVM Wallet
            <Wallet style={{ width: 11, height: 11 }} />
          </button>
        )}
      </div>
    );
  }

  if (needsEvm && balance !== null) {
    const primaryBal = balance ?? 0;

    if (deficit <= 0) return null;

    const fundNeeded = deficit;
    const hasSomeBalance = primaryBal > 0;
    const accentColor = hasSomeBalance ? "#E8B931" : "#f97316";
    const bgColor = hasSomeBalance ? "rgba(233,185,49,0.06)" : "rgba(249,115,22,0.06)";
    const borderColor = hasSomeBalance ? "rgba(233,185,49,0.15)" : "rgba(249,115,22,0.15)";
    const Icon = hasSomeBalance ? ArrowRightLeft : AlertTriangle;

    return (
      <div
        data-testid="collateral-banner-deficit"
        style={{
          padding: "10px 12px",
          borderRadius: 6,
          marginBottom: 10,
          background: bgColor,
          border: `1px solid ${borderColor}`,
          position: "relative",
        }}
      >
        <button
          data-testid="collateral-banner-dismiss"
          onClick={() => setDismissed(true)}
          style={{
            position: "absolute", top: 6, right: 6,
            background: "none", border: "none", color: "#5E6673",
            cursor: "pointer", padding: 2, lineHeight: 0,
          }}
        >
          <X style={{ width: 10, height: 10 }} />
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
          <Icon style={{ width: 12, height: 12, color: accentColor, flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 10, color: "#e4e4ec", fontFamily: mono, fontWeight: 600, lineHeight: 1.4, marginBottom: 2 }}>
              Fund your account
            </div>
            <div style={{ fontSize: 9, color: "#7a7a90", fontFamily: mono, lineHeight: 1.5 }}>
              {hasSomeBalance
                ? <>Balance: <span style={{ color: "#e4e4ec" }}>${primaryBal.toFixed(2)}</span> &bull; Need <span style={{ color: accentColor }}>${fundNeeded.toFixed(2)}</span> more {token} on {chainLabel}</>
                : <>Need <span style={{ color: accentColor }}>${fundNeeded.toFixed(2)}</span> {token} on {chainLabel} to open this position</>
              }
            </div>
          </div>
        </div>

        <button
          data-testid="collateral-banner-fund-now"
          onClick={onGetToken}
          style={{
            width: "100%", padding: "8px 0", borderRadius: 5,
            border: `1px solid ${accentColor}33`,
            background: `${accentColor}14`,
            color: accentColor, fontSize: 10, fontWeight: 700, fontFamily: mono,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 6, letterSpacing: "0.04em",
            transition: "opacity 0.12s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          Fund Now
          <ArrowRight style={{ width: 11, height: 11 }} />
        </button>
      </div>
    );
  }

  if (balance === null) return null;

  if (balance > 0 && deficit > 0 && !needsEvm && onDeposit) {
    const proto = protocolName || "Protocol";
    return (
      <div
        data-testid="collateral-banner-deposit"
        style={{
          padding: "10px 12px", borderRadius: 6, marginBottom: 10,
          background: "rgba(212,165,116,0.06)",
          border: "1px solid rgba(212,165,116,0.18)",
          position: "relative",
        }}
      >
        <button
          data-testid="collateral-banner-dismiss"
          onClick={() => setDismissed(true)}
          style={{ position: "absolute", top: 6, right: 6, background: "none", border: "none", color: "#5E6673", cursor: "pointer", padding: 2, lineHeight: 0 }}
        >
          <X style={{ width: 10, height: 10 }} />
        </button>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
          <ArrowDownToLine style={{ width: 12, height: 12, color: "#D4A574", flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 10, color: "#e4e4ec", fontFamily: mono, fontWeight: 600, lineHeight: 1.4, marginBottom: 2 }}>
              Fund your account
            </div>
            <div style={{ fontSize: 9, color: "#7a7a90", fontFamily: mono, lineHeight: 1.5 }}>
              You have <span style={{ color: "#e4e4ec" }}>${balance.toFixed(2)} {token}</span> in your wallet. Deposit ~<span style={{ color: "#e4e4ec" }}>${(balance + deficit).toFixed(2)}</span> into {proto} to open this position.
            </div>
          </div>
        </div>
        <button
          data-testid="collateral-banner-deposit-btn"
          onClick={onDeposit}
          style={{
            width: "100%", padding: "8px 0", borderRadius: 5,
            border: "1px solid rgba(212,165,116,0.3)",
            background: "rgba(212,165,116,0.1)",
            color: "#D4A574", fontSize: 10, fontWeight: 700, fontFamily: mono,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 6, letterSpacing: "0.04em",
            transition: "opacity 0.12s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          Fund Now
          <ArrowDownToLine style={{ width: 11, height: 11 }} />
        </button>
      </div>
    );
  }

  if (balance > 0) return null;

  if (deficit <= 0) return null;

  return (
    <div
      data-testid="collateral-banner"
      style={{
        padding: "10px 12px", borderRadius: 6, marginBottom: 10,
        background: "rgba(249,115,22,0.06)",
        border: "1px solid rgba(249,115,22,0.15)",
        position: "relative",
      }}
    >
      <button
        data-testid="collateral-banner-dismiss"
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute", top: 6, right: 6,
          background: "none", border: "none", color: "#5E6673",
          cursor: "pointer", padding: 2, lineHeight: 0,
        }}
      >
        <X style={{ width: 10, height: 10 }} />
      </button>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <AlertTriangle style={{ width: 12, height: 12, color: "#f97316", flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 10, color: "#e4e4ec", fontFamily: mono, fontWeight: 600, lineHeight: 1.4, marginBottom: 2 }}>
            Fund your account
          </div>
          <div style={{ fontSize: 9, color: "#7a7a90", fontFamily: mono, lineHeight: 1.5 }}>
            Need ~<span style={{ color: "#f97316" }}>${deficit.toFixed(2)}</span> {token} to open this position.
          </div>
        </div>
      </div>
      <button
        data-testid="collateral-banner-get-token"
        onClick={onGetToken}
        style={{
          width: "100%", padding: "8px 0", borderRadius: 5,
          border: "1px solid rgba(249,115,22,0.25)",
          background: "rgba(249,115,22,0.08)",
          color: "#f97316", fontSize: 10, fontWeight: 700, fontFamily: mono,
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 6, letterSpacing: "0.04em",
          transition: "opacity 0.12s",
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      >
        Fund Now
        <ArrowRight style={{ width: 11, height: 11 }} />
      </button>
    </div>
  );
}
