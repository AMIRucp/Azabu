"use client";

import { useState } from "react";
import AnimatedPrice from "@/components/AnimatedPrice";
import { PROTOCOLS } from "@/config/protocolRegistry";
import { T, mono } from "./terminalTheme";
import type { UnifiedMarket } from "@/types/market";
import MobileNavDrawer from "./MobileNavDrawer";
import useActivityStore from "@/stores/useActivityStore";

type ChainId = "arbitrum" | "hyperliquid" | "lighter";

interface TerminalHeaderProps {
  chain: ChainId;
  setChain: (c: ChainId) => void;
  rawSym: string;
  sym: string;
  maxLevLabel: string;
  currentPrice: number;
  currentChange: number;
  currentVol: number;
  currentOI: number;
  currentFunding: number;
  selectedProtocol?: string;
  crossProtocolData: UnifiedMarket[];
  onOpenMarketSelector: () => void;
  onSelectMarket: (symbol: string, protocol?: string) => void;
  onBackToBrowser?: () => void;
  onOpenPortfolio?: () => void;
  onOpenSettings?: () => void;
  isMobile?: boolean;
}

const COLLATERAL_PILLS: { id: ChainId; label: string; color: string; icon: string }[] = [
  { id: "arbitrum",    label: "USDT", color: "#26A17B", icon: "/tokens/usdt.png" },
  { id: "hyperliquid", label: "USDC", color: "#2775CA", icon: "/tokens/usdc.webp" },
];

const CHAIN_BADGE: Record<ChainId, { label: string; color: string; icon?: string }> = {
  arbitrum: { label: "ARB", color: "#E8B931" },
  hyperliquid: { label: "HL", color: "#33FF88", icon: "/tokens/hyperliquid.webp" },
  lighter: { label: "LTR", color: "#6366F1", icon: "/tokens/lighter.webp" },
};

const CROSS_CHAIN_BADGE: Record<string, { label: string; color: string; icon?: string }> = {
  arbitrum: { label: "ARB", color: "#28A0F0" },
  hyperliquid: { label: "HL", color: "#33FF88", icon: "/tokens/hyperliquid.webp" },
};


const fmtStat = (v: number) => {
  if (!v) return "$0";
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

export default function TerminalHeader({
  chain, setChain,
  rawSym, sym, maxLevLabel, currentPrice, currentChange,
  currentVol, currentOI, currentFunding,
  selectedProtocol, crossProtocolData, onOpenMarketSelector, onSelectMarket, onBackToBrowser,
  onOpenPortfolio, onOpenSettings,
  isMobile,
}: TerminalHeaderProps) {
  const badge = CHAIN_BADGE[chain];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const wsConnected = useActivityStore((s) => s.isConnected);
  const wsDotColor = wsConnected ? "#33FF88" : "#F6465D";
  const wsDotTitle = wsConnected ? "Live feed connected" : "Live feed disconnected";

  if (isMobile) {
    return (
      <>
        <MobileNavDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          chain={chain}
          onOpenMarkets={() => { setDrawerOpen(false); onOpenMarketSelector(); }}
          onOpenPortfolio={() => { setDrawerOpen(false); onOpenPortfolio?.(); }}
          onOpenSettings={() => { setDrawerOpen(false); onOpenSettings?.(); }}
          onNavigateSwap={() => {
            setDrawerOpen(false);
            window.dispatchEvent(new CustomEvent("afx-navigate", { detail: { page: "swap" } }));
          }}
        />
        <div data-testid="perps-terminal-header" style={{ flexShrink: 0, padding: "10px 16px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            {onBackToBrowser && (
              <button data-testid="btn-back-to-browser" onClick={onBackToBrowser} style={{
                background: "transparent", border: "none", width: 28, height: 28,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: T.text2, fontSize: 18, flexShrink: 0,
              }}>&#x2190;</button>
            )}
            <button
              data-testid="mobile-drawer-open"
              onClick={() => setDrawerOpen(true)}
              style={{
                height: 30, borderRadius: 10,
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.015) 30%)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                padding: '0 12px',
                transition: 'background 0.15s, transform 0.1s',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                WebkitTapHighlightColor: 'transparent',
                color: 'rgba(255,255,255,0.88)',
                fontSize: 14, fontWeight: 500, letterSpacing: '0.2px',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
              }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Trade
            </button>
            <button data-testid="perps-market-selector-btn" onClick={onOpenMarketSelector} style={{
              padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, fontFamily: mono, color: "#D4A574", letterSpacing: "-0.02em" }}>{rawSym.replace(/-PERP$/, "").replace(/USDT$/, "")}</span>
              <span style={{ fontSize: 10, color: T.text3, fontFamily: mono }}>/USD</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke={T.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div style={{ flexGrow: 1 }} />
            <div style={{ display: "flex", gap: 3 }}>
              {COLLATERAL_PILLS.map(p => {
                const active = chain === p.id;
                return (
                  <button key={p.id} data-testid={`perps-chain-${p.id}`} onClick={() => setChain(p.id)} title={p.label} style={{
                    width: 28, height: 28, borderRadius: 5, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: active ? `1.5px solid ${p.color}55` : "1.5px solid transparent",
                    background: active ? `${p.color}14` : "transparent",
                    transition: "all 0.15s",
                  }}>
                    <img src={p.icon} alt={p.label} style={{ width: 13, height: 13, borderRadius: "50%", opacity: active ? 1 : 0.35 }} />
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            {currentPrice > 0 && (
              <AnimatedPrice value={currentPrice} decimals={currentPrice >= 100 ? 2 : currentPrice >= 1 ? 4 : 6} prefix="$" style={{ fontSize: 22, fontWeight: 800, fontFamily: mono, color: T.text, letterSpacing: "-0.02em" }} />
            )}
            <span style={{
              fontSize: 11, fontWeight: 600, color: currentChange >= 0 ? T.green : T.red,
              fontFamily: mono,
            }}>
              {currentChange >= 0 ? "+" : ""}{currentChange.toFixed(2)}%
            </span>
          </div>
        </div>
      </>
    );
  }

  return (
    <div data-testid="perps-terminal-header" style={{ flexShrink: 0, background: "rgba(255,255,255,0.02)" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "6px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        {onBackToBrowser && (
          <button
            data-testid="btn-back-to-browser"
            onClick={onBackToBrowser}
            style={{
              background: T.bgEl, border: `1px solid ${T.border}`,
              borderRadius: 4, width: 28, height: 28, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: T.text2, fontSize: 14, flexShrink: 0,
            }}
            title="Back to markets"
          >
            &#x2190;
          </button>
        )}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {COLLATERAL_PILLS.map(p => {
            const active = chain === p.id;
            return (
              <button
                key={p.id}
                data-testid={`perps-chain-${p.id}`}
                onClick={() => setChain(p.id)}
                title={p.label}
                style={{
                  height: 36, paddingLeft: 10, paddingRight: 12, borderRadius: 8, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  transition: "all 0.15s",
                  border: active ? `1.5px solid ${p.color}66` : "1.5px solid rgba(255,255,255,0.10)",
                  background: active ? `${p.color}18` : "rgba(255,255,255,0.02)",
                  boxShadow: active ? `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 12px ${p.color}18` : "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                }}
              >
                <img
                  src={p.icon}
                  alt={p.label}
                  style={{
                    width: 16, height: 16, borderRadius: "50%",
                    opacity: active ? 1 : 0.5,
                    transition: "opacity 0.15s",
                    flexShrink: 0,
                  }}
                />
                <span style={{
                  fontSize: 12, fontWeight: 600, color: active ? p.color : "rgba(255,255,255,0.6)",
                  fontFamily: mono, transition: "color 0.15s", letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                }}>
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        data-testid="perps-market-stats"
        style={{
          display: "flex", alignItems: "center", gap: 16, padding: "0 16px",
          height: 40,
          borderBottom: "1px solid rgba(255,255,255,0.05)", overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
            flexShrink: 0,
          }}
          onClick={onOpenMarketSelector}
          data-testid="perps-market-selector-btn"
        >
          <span style={{ fontWeight: 900, fontSize: 16, color: "#D4A574", fontFamily: mono }}>{rawSym}</span>
          <span style={{
            fontSize: 8, fontWeight: 600, color: badge.color,
            background: `${badge.color}10`,
            padding: "2px 5px", borderRadius: 3, fontFamily: mono,
            display: "inline-flex", alignItems: "center", gap: 2, opacity: 0.8,
          }}>{badge.icon ? <img src={badge.icon} alt={badge.label} style={{ width: 10, height: 10, borderRadius: "50%" }} /> : badge.label}</span>
          <span style={{
            fontSize: 8, color: T.text3, background: 'rgba(255,255,255,0.04)',
            padding: "2px 5px", borderRadius: 3, fontFamily: mono, fontWeight: 600,
          }}>{maxLevLabel}</span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0 }}>
            <path d="M1 1L5 5L9 1" stroke={T.text2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {currentPrice > 0 && (
          <>
            <span style={{ fontSize: 22, fontWeight: 900, fontFamily: mono, flexShrink: 0 }}>
              <AnimatedPrice value={currentPrice} decimals={currentPrice >= 100 ? 2 : currentPrice >= 1 ? 4 : 6} prefix="$" style={{ fontSize: 22, fontWeight: 900, color: T.text }} />
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, color: currentChange >= 0 ? T.green : T.red,
              fontFamily: mono, flexShrink: 0, opacity: 0.9,
            }}>
              {currentChange >= 0 ? "+" : ""}{currentChange.toFixed(2)}%
            </span>
          </>
        )}

        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.04)", flexShrink: 0 }} />

        {[
          { label: "24h Vol", value: fmtStat(currentVol), color: T.text2 },
          { label: "OI", value: fmtStat(currentOI), color: T.text2 },
          { label: "Funding", value: currentFunding ? `${currentFunding >= 0 ? "+" : ""}${currentFunding.toFixed(4)}%` : "0.0000%", color: currentFunding > 0 ? T.green : currentFunding < 0 ? T.red : T.text3 },
        ].map(({ label, value, color }) => (
          <div key={label} data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`} style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: T.text3, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: mono, lineHeight: 1, opacity: 0.7 }}>{label}</span>
            <span style={{ fontSize: 11, fontFamily: mono, color, fontWeight: 500, fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginTop: 3 }}>{value}</span>
          </div>
        ))}

        {crossProtocolData.length > 1 && (
          <>
            <div style={{ width: 1, height: 20, background: T.border, flexShrink: 0 }} />
            <div style={{ display: "inline-flex", borderRadius: 4, overflow: "hidden", border: `1px solid ${T.border}`, flexShrink: 0 }}>
              {crossProtocolData.map(cp => {
                const cfg = PROTOCOLS[cp.protocol];
                const isActive = cp.symbol === sym && cp.protocol === selectedProtocol;
                return (
                  <button
                    key={cp.id}
                    data-testid={`venue-${cp.protocol}`}
                    onClick={() => {
                      if (!isActive) onSelectMarket(cp.symbol, cp.protocol);
                    }}
                    style={{
                      padding: "3px 8px", border: "none", cursor: isActive ? "default" : "pointer",
                      fontSize: 9, fontWeight: isActive ? 700 : 400,
                      fontFamily: mono, letterSpacing: "0.03em", textTransform: "uppercase",
                      background: isActive ? T.bgEl : "transparent",
                      color: isActive ? cfg.color : T.text3,
                      transition: "all 0.12s",
                    }}
                  >
                    {cp.protocol}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div style={{ marginLeft: "auto", flexShrink: 0, display: "flex", alignItems: "center" }}>
          <div
            data-testid="ws-status-dot"
            title={wsDotTitle}
            style={{
              width: 7, height: 7, borderRadius: "50%",
              background: wsDotColor,
              boxShadow: `0 0 5px ${wsDotColor}`,
              opacity: 0.9,
            }}
          />
        </div>
      </div>
    </div>
  );
}
