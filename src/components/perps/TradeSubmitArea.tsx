"use client";

import { useRef } from "react";
import { Loader2, CheckCircle, XCircle, AlertTriangle, ArrowDownToLine } from "lucide-react";
import TradeConfirmation from "@/components/TradeConfirmation";
import type { TxState } from "@/hooks/executors/shared";
import { addRipple } from "@/lib/tradeAnimations";

interface Theme {
  bg: string; bgCard: string; bgEl: string; bgHover: string; bgInput: string;
  border: string; borderSub: string; text: string; text2: string; text3: string;
  green: string; greenDim: string; red: string; redDim: string; orange: string; orangeDim: string;
}

const mono = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

export interface TradeSubmitAreaProps {
  T: Theme;
  chain: "arbitrum" | "hyperliquid";
  market: { sym: string; price: number };
  side: "long" | "short";
  sizeNum: number;
  posValue: number;
  collateral: number;
  lev: number;
  walletConnected: boolean;
  availableBalance: number | null;
  protocol: string;
  txState: TxState;
  txMsg: string;
  txSig: string | null;
  dismiss: () => void;
  handleSubmit: () => void;
  pendingConfirm: boolean;
  setPendingConfirm: (v: boolean) => void;
  executeTradeInner: () => void;
  onGetToken?: () => void;
  onDeposit?: () => void;
  onConnectWallet?: () => void;
  viewOnly?: boolean;
  retryTpSl?: () => void;
  evmConnected?: boolean;
  isMobile?: boolean;
}

export default function TradeSubmitArea(props: TradeSubmitAreaProps) {
  const {
    T, chain, market, side, sizeNum, posValue, collateral, lev,
    walletConnected, availableBalance, protocol,
    txState, txMsg, txSig, dismiss, handleSubmit,
    pendingConfirm, setPendingConfirm, executeTradeInner,
    onGetToken, onDeposit, onConnectWallet, viewOnly, retryTpSl,
    evmConnected, isMobile,
  } = props;

  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const setupInFlight = txState === "setup" && (txMsg?.includes("Setting") || txMsg?.includes("Retrying"));
  const setupFailed = txState === "setup" && !setupInFlight;
  const busy = txState === "signing" || txState === "bridging" || setupInFlight;

  const isArbitrum = chain === "arbitrum";
  const isHL = chain === "hyperliquid";
  const needsEvm = isArbitrum || isHL;
  const anyWalletReady = needsEvm ? !!evmConnected : walletConnected;
  const insufficientBalance = anyWalletReady && needsEvm && availableBalance !== null && availableBalance < collateral && sizeNum > 0;

  const getButtonLabel = () => {
    if (!anyWalletReady) return "Connect Wallet";
    if (txState === "bridging") return "Bridging...";
    if (setupInFlight) return "Setting TP/SL...";
    if (txState === "signing") return "Submitting...";
    if (insufficientBalance) return "Insufficient Balance";
    const sideLabel = side === "long" ? "Long" : "Short";
    return `${sideLabel} ${market.sym}`;
  };

  const getButtonStyle = (): React.CSSProperties => {
    if (!anyWalletReady) {
      return { background: "rgba(255,255,255,0.06)", color: T.text, border: "none" };
    }
    if (insufficientBalance) {
      return { background: T.bgEl, color: T.text3, border: "none", cursor: "not-allowed", opacity: 0.7 };
    }
    const tint = side === "long" ? T.green : T.red;
    return {
      background: `${tint}cc`,
      color: "#fff",
      border: "none",
    };
  };

  return (
    <>
      {pendingConfirm && (
        <TradeConfirmation
          params={{ side: side.toUpperCase(), symbol: market.sym, leverage: lev, sizeUsd: posValue }}
          onConfirm={() => { setPendingConfirm(false); executeTradeInner(); }}
          onCancel={() => setPendingConfirm(false)}
        />
      )}

      {txState !== "idle" && (
        <div
          data-testid="trade-tx-status"
          onClick={dismiss}
          style={{
            padding: "8px 10px", borderRadius: 6, marginBottom: 10, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
            background: txState === "success" ? T.greenDim : (busy || setupFailed) ? T.orangeDim : T.redDim,
            border: `1px solid ${txState === "success" ? "rgba(0,212,146,0.2)" : (busy || setupFailed) ? "rgba(249,115,22,0.2)" : "rgba(239,68,97,0.2)"}`,
          }}
        >
          {(txState === "signing" || txState === "bridging" || setupInFlight) && <Loader2 className="animate-spin" style={{ width: 12, height: 12, color: T.orange, flexShrink: 0 }} />}
          {txState === "success" && <CheckCircle style={{ width: 12, height: 12, color: T.green, flexShrink: 0 }} />}
          {txState === "error" && <XCircle style={{ width: 12, height: 12, color: T.red, flexShrink: 0 }} />}
          {setupFailed && <AlertTriangle style={{ width: 12, height: 12, color: T.orange, flexShrink: 0 }} />}
          <span style={{ fontSize: 10, color: T.text, fontFamily: mono, lineHeight: 1.3, flex: 1 }}>
            {(txState === "signing" || txState === "bridging") ? (txMsg || "Processing...") : txMsg}
          </span>
          {retryTpSl && setupFailed && (
            <button
              data-testid="trade-retry-tpsl"
              onClick={e => { e.stopPropagation(); retryTpSl(); }}
              style={{
                padding: "2px 8px", borderRadius: 3, border: `1px solid ${T.orange}`,
                background: "transparent", color: T.orange, fontSize: 9, fontFamily: mono,
                fontWeight: 600, cursor: "pointer", flexShrink: 0, marginLeft: "auto",
              }}
            >Retry</button>
          )}
          {txSig && (
            <a
              href={chain === "arbitrum" ? `https://arbiscan.io/tx/${txSig}` : `https://solscan.io/tx/${txSig}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ fontSize: 9, color: T.text2, fontFamily: mono, marginLeft: (retryTpSl && setupFailed) ? undefined : "auto", textDecoration: "underline", flexShrink: 0 }}
            >View</a>
          )}
        </div>
      )}

      {viewOnly ? (
        <button
          data-testid="trade-submit-button"
          disabled
          style={{
            width: "100%", padding: "13px 0", borderRadius: 7, border: "none",
            cursor: "not-allowed",
            fontSize: 12, fontWeight: 700, fontFamily: mono, textTransform: "uppercase", letterSpacing: "0.04em",
            background: T.bgEl, color: T.text3, opacity: 0.7,
          }}
        >View Only -- Trading Not Available</button>
      ) : !isArbitrum && walletConnected && availableBalance !== null && availableBalance <= 0 && sizeNum > 0 ? (
        <button
          data-testid="trade-submit-button"
          onClick={() => onGetToken?.()}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 7, cursor: "pointer",
            fontSize: 13, fontWeight: 800, fontFamily: mono, textTransform: "uppercase", letterSpacing: "0.06em",
            background: T.orangeDim, color: T.orange, border: `1px solid rgba(249,115,22,0.2)`,
            transition: "opacity 0.12s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >Get USDC to Trade</button>
      ) : !isArbitrum && walletConnected && availableBalance !== null && collateral > availableBalance && availableBalance > 0 && sizeNum > 0 ? (
        <button
          data-testid="trade-submit-button"
          onClick={() => onDeposit?.()}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 7, cursor: "pointer",
            fontSize: 12, fontWeight: 700, fontFamily: mono, textTransform: "uppercase", letterSpacing: "0.04em",
            background: "rgba(212,165,116,0.1)", color: "#D4A574", border: `1px solid rgba(212,165,116,0.25)`,
            transition: "opacity 0.12s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <ArrowDownToLine style={{ width: 13, height: 13 }} />
          {(() => { const w = protocol.split(" ")[0]; return `Deposit to ${w.charAt(0)}${w.slice(1).toLowerCase()}`; })()}
        </button>
      ) : (
        <button
          ref={submitBtnRef}
          data-testid="trade-submit-button"
          onClick={(e) => {
            if (!anyWalletReady) {
              onConnectWallet?.();
              return;
            }
            if (insufficientBalance) return;
            if (submitBtnRef.current) addRipple(e, submitBtnRef.current);
            handleSubmit();
          }}
          disabled={busy || insufficientBalance}
          style={{
            width: "100%", padding: isMobile ? "12px 0" : "13px 0", borderRadius: isMobile ? 8 : 8,
            cursor: (busy || insufficientBalance) ? "not-allowed" : "pointer",
            fontSize: isMobile ? 12 : 13, fontWeight: 700, fontFamily: mono, textTransform: "uppercase", letterSpacing: "0.06em",
            ...getButtonStyle(),
            transition: "opacity 0.15s",
            opacity: busy ? 0.6 : 1,
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={e => { if (!busy) e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = busy ? "0.6" : "1"; }}
        >
          {getButtonLabel()}
        </button>
      )}

      <div style={{ marginTop: 6, textAlign: "center" }}>
        <span data-testid="trade-protocol-label" style={{ fontSize: 9, color: T.text3, fontFamily: mono, letterSpacing: "0.06em", fontWeight: 400 }}>
          {!anyWalletReady && needsEvm
            ? (isHL ? "Requires EVM wallet for Hyperliquid" : "Requires EVM wallet for Arbitrum")
            : protocol
          }
        </span>
      </div>
    </>
  );
}
