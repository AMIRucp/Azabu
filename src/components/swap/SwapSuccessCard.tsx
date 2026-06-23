"use client";

import type { CSSProperties, ReactNode } from "react";
import { ChevronDown, Clock, ExternalLink, Fuel, Shield } from "lucide-react";
import { SANS } from "./swapConstants";

const SUCCESS_ICON = "/icons/Success.png";
const DISPLAY = "'Space Grotesk', sans-serif";

/** Figma swap success card — 469×639, 20px radius, 80% fill, 20% stroke */
const SWAP_SUCCESS = {
  width: 410,
  height: 639,
  radius: 20,
  fill: "linear-gradient(180deg, rgba(22,22,22,0.8) 0%, rgba(10,10,10,0.8) 100%)",
  stroke: "1px solid rgba(255,255,255,0.2)",
  blur: "16.65px",
  padX: 22,
  headerPadTop: 20,
  heroIconSize: 200,
  titleSize: 28,
  heroAmountSize: 18,
  detailGap: 14,
  detailsPadTop: 18,
  detailsPadBottom: 22,
} as const;

const DETAIL_LABEL: CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  fontFamily: DISPLAY,
  lineHeight: "20px",
  color: "#FFFFFF",
};

const DETAIL_VALUE: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  fontFamily: SANS,
  lineHeight: "20px",
};

export interface SwapSuccessToken {
  symbol: string;
  logoURI?: string;
  name?: string;
}

function isStableSymbol(symbol: string): boolean {
  return ["USDC", "USDT", "DAI", "USD"].includes(symbol.toUpperCase());
}

function formatAmount(value: string | number): string {
  const num = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, ""));
  if (!Number.isFinite(num) || num <= 0) return "0.00";
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function formatUsd(value: number | null): string | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function resolveUsdValue(amount: number, symbol: string, otherAmount: number, otherSymbol: string): string | null {
  if (isStableSymbol(symbol)) return formatUsd(amount);
  if (isStableSymbol(otherSymbol)) return formatUsd(otherAmount);
  return null;
}

function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  if (minutes <= 0) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  if (seconds <= 0) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  return `${minutes} minute${minutes === 1 ? "" : "s"}, ${seconds} second${seconds === 1 ? "" : "s"}`;
}

function buildSwapId(txHash: string): string {
  const suffix = parseInt(txHash.slice(-4), 16);
  return `#${((Number.isFinite(suffix) ? suffix : 4351) % 9000) + 1000}`;
}

function TokenAmount({
  amount,
  token,
  usd,
  compact = false,
}: {
  amount: string;
  token: SwapSuccessToken;
  usd: string | null;
  compact?: boolean;
}) {
  const iconSize = compact ? 18 : 22;
  const amountSize = compact ? 14 : SWAP_SUCCESS.heroAmountSize;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "nowrap",
        whiteSpace: "nowrap",
        justifyContent: compact ? "flex-end" : "center",
      }}
    >
      <span style={{ ...DETAIL_VALUE, fontSize: amountSize, color: "#FFFFFF" }}>
        {formatAmount(amount)}
      </span>
      {token.logoURI ? (
        <img
          src={token.logoURI}
          alt={token.symbol}
          style={{ width: iconSize, height: iconSize, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <span
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: "50%",
            background: "linear-gradient(180deg, #2563EB 0%, #153885 100%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            fontWeight: 700,
            color: "#FFFFFF",
            flexShrink: 0,
          }}
        >
          {token.symbol.slice(0, 2)}
        </span>
      )}
      <span style={{ ...DETAIL_VALUE, fontSize: amountSize, color: "#FFFFFF" }}>
        {token.symbol}
      </span>
      {usd && (
        <span style={{ ...DETAIL_VALUE, fontSize: compact ? 14 : 16, fontWeight: 500, color: "#9CA3AF" }}>
          ({usd})
        </span>
      )}
    </span>
  );
}

function DetailRow({
  label,
  children,
  valueColor = "#FFFFFF",
}: {
  label: string;
  children: ReactNode;
  valueColor?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 28 }}>
      <span style={{ ...DETAIL_LABEL, flexShrink: 0 }}>{label}</span>
      <div style={{ color: valueColor, textAlign: "right", flexShrink: 0, minWidth: 0 }}>{children}</div>
    </div>
  );
}

export function SwapSuccessCard({
  fromToken,
  toToken,
  fromAmt,
  toAmt,
  txLink,
  priceImpact = "—",
  estGas = "—",
  durationSec,
  txHash,
  isMobile = false,
  title = "Swap completed!",
}: {
  fromToken: SwapSuccessToken;
  toToken: SwapSuccessToken;
  fromAmt: string;
  toAmt: string;
  txLink: string;
  onNew?: () => void;
  priceImpact?: string;
  estGas?: string;
  durationSec?: number;
  txHash: string;
  isMobile?: boolean;
  title?: string;
}) {
  const fromNum = parseFloat(fromAmt.replace(/,/g, "")) || 0;
  const toNum = parseFloat(toAmt.replace(/,/g, "")) || 0;
  const fromUsd = resolveUsdValue(fromNum, fromToken.symbol, toNum, toToken.symbol);
  const toUsd = resolveUsdValue(toNum, toToken.symbol, fromNum, fromToken.symbol);
  const exchangeRate =
    fromNum > 0 && toNum > 0
      ? `1 ${fromToken.symbol} ⇆ ${(toNum / fromNum).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toToken.symbol}`
      : null;

  const gasDisplay =
    !estGas || estGas === "—" || estGas === "…"
      ? "—"
      : estGas.startsWith("$")
        ? estGas
        : estGas === "Source chain gas"
          ? "—"
          : estGas;

  const cardWidth = isMobile ? 390 : SWAP_SUCCESS.width;
  const scale = cardWidth / SWAP_SUCCESS.width;
  const cardHeight = Math.round(SWAP_SUCCESS.height * scale);
  const iconSize = Math.round(SWAP_SUCCESS.heroIconSize * scale);

  return (
    <div
      style={{
        width: cardWidth,
        height: cardHeight,
        maxWidth: "calc(100vw - 32px)",
        background: SWAP_SUCCESS.fill,
        border: SWAP_SUCCESS.stroke,
        borderRadius: SWAP_SUCCESS.radius,
        backdropFilter: `blur(${SWAP_SUCCESS.blur})`,
        WebkitBackdropFilter: `blur(${SWAP_SUCCESS.blur})`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        animation: "swapSuccessFadeIn 0.35s ease-out",
      }}
      data-testid="swap-success-card"
    >
      <style>{`
        @keyframes swapSuccessFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${SWAP_SUCCESS.headerPadTop}px ${SWAP_SUCCESS.padX}px 0`,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: "#9CA3AF", fontFamily: SANS }}>
          Swap {buildSwapId(txHash)}
        </span>
        {txLink ? (
          <a
            href={txLink}
            target="_blank"
            rel="noreferrer"
            data-testid="link-tx"
            style={{
              width: 31,
              height: 31,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9CA3AF",
              textDecoration: "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <ExternalLink size={16} />
          </a>
        ) : null}
      </div>

      {/* Hero */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: `0 ${SWAP_SUCCESS.padX}px`,
          textAlign: "center",
        }}
      >
        <img
          src={SUCCESS_ICON}
          alt=""
          aria-hidden
          style={{
            width: iconSize,
            height: iconSize,
            objectFit: "contain",
            marginBottom: scale < 1 ? 12 : 16,
            flexShrink: 0,
          }}
        />
        <h2
          style={{
            margin: "0 0 16px",
            fontSize: scale < 1 ? 24 : SWAP_SUCCESS.titleSize,
            fontWeight: 600,
            color: "#FFFFFF",
            fontFamily: SANS,
            lineHeight: 1.15,
          }}
        >
          {title}
        </h2>
        <TokenAmount amount={fromAmt} token={fromToken} usd={fromUsd} />
      </div>

      {/* Details */}
      <div
        style={{
          padding: `${SWAP_SUCCESS.detailsPadTop}px ${SWAP_SUCCESS.padX}px ${SWAP_SUCCESS.detailsPadBottom}px`,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: SWAP_SUCCESS.detailGap,
        }}
      >
        <DetailRow label="You deposited">
          <TokenAmount amount={fromAmt} token={fromToken} usd={fromUsd} compact />
        </DetailRow>
        <DetailRow label="Payout">
          <TokenAmount amount={toAmt} token={toToken} usd={toUsd} compact />
        </DetailRow>
        <DetailRow label="Time to Complete">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              ...DETAIL_VALUE,
              color: "#FFFFFF",
              whiteSpace: "nowrap",
            }}
          >
            <Clock size={16} color="#FF4FA3" strokeWidth={2} />
            {durationSec != null ? formatDuration(durationSec) : "—"}
          </span>
        </DetailRow>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            paddingTop: 4,
            minHeight: 28,
          }}
        >
          <span
            style={{
              ...DETAIL_VALUE,
              color: "#FFFFFF",
              whiteSpace: "nowrap",
              flexShrink: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {exchangeRate ?? "—"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#FFFFFF", flexShrink: 0, whiteSpace: "nowrap" }}>
            <span style={DETAIL_VALUE}>{priceImpact}</span>
            <Shield size={14} strokeWidth={2} />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, ...DETAIL_VALUE }}>
              <Fuel size={14} strokeWidth={2} />
              {gasDisplay}
            </span>
            <button
              type="button"
              aria-label="More details"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                cursor: "pointer",
                flexShrink: 0,
                padding: 0,
              }}
            >
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
