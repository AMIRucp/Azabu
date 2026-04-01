"use client";

import { getIconWithJupiter } from "@/config/tokenIcons";
import { useJupiterLogos } from "@/hooks/useJupiterLogos";
import useSettingsStore from "@/stores/useSettingsStore";

const SANS = "Inter, -apple-system, sans-serif";

export const PROTOCOL_COLORS: Record<string, string> = {
  wallet: "#9BA4AE",
  drift: "#9945FF",
  jupiter: "#22D1EE",
  aster: "#D4A574",
};

export const CHAIN_COLORS: Record<string, string> = {
  Solana: "#9945FF",
  Arbitrum: "#28A0F0",
};

export function formatUsd(v: number): string {
  if (useSettingsStore.getState().hideBalances) return "****";
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}

export function formatPrice(v: number): string {
  if (v === 0) return "--";
  if (v >= 10000) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (v >= 100) return `$${v.toFixed(2)}`;
  if (v >= 1) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(6)}`;
}

export function formatAmount(v: number): string {
  if (useSettingsStore.getState().hideBalances) return "****";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 10_000) return `${(v / 1_000).toFixed(2)}K`;
  if (v >= 100) return v.toFixed(2);
  if (v >= 1) return v.toFixed(4);
  if (v >= 0.001) return v.toFixed(6);
  return v.toFixed(8);
}

const CHAIN_LOGOS: Record<string, string> = {
  Solana: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
  Arbitrum: "https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png",
};

export function ChainBadge({ chain }: { chain: string }) {
  const color = CHAIN_COLORS[chain] || "#71717A";
  const logo = CHAIN_LOGOS[chain];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 9, fontWeight: 700, fontFamily: SANS, color,
        background: `${color}15`, padding: "2px 7px", borderRadius: 3,
        letterSpacing: "0.05em",
      }}
    >
      {logo ? (
        <img src={logo} alt={chain} width={14} height={14} style={{ borderRadius: "50%", flexShrink: 0 }} />
      ) : (
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
      )}
      {chain}
    </span>
  );
}

export function ProtocolBadge({ protocol }: { protocol: string }) {
  const color = PROTOCOL_COLORS[protocol.toLowerCase()] || "#71717A";
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center",
        fontSize: 9, fontWeight: 700, fontFamily: SANS, color,
        background: `${color}18`, padding: "1px 6px", borderRadius: 3,
        textTransform: "capitalize", letterSpacing: "0.05em",
      }}
    >
      {protocol}
    </span>
  );
}

export function TokenIcon({ symbol, size = 28 }: { symbol: string; size?: number }) {
  const jupiterLogos = useJupiterLogos();
  const icon = getIconWithJupiter(symbol, jupiterLogos);
  const emojiSize = Math.round(size * 0.58);
  const letterSize = Math.round(size * 0.38);
  if (icon.type === "img") {
    return (
      <img
        src={icon.value} alt={symbol} width={size} height={size}
        style={{ borderRadius: "50%", background: "rgba(255,255,255,0.06)", flexShrink: 0 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  if (icon.type === "emoji") {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: emojiSize, flexShrink: 0,
      }}>
        {icon.value}
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "rgba(255,255,255,0.06)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: letterSize, fontWeight: 700, color: "#9BA4AE",
      fontFamily: SANS, flexShrink: 0,
    }}>
      {icon.value}
    </div>
  );
}
