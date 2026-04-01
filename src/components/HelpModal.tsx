"use client";

import { useState, useEffect } from "react";
const metamaskLogo = "/metamask-logo.png";
const rabbyLogo = "/rabby-logo.png";
const coinbaseLogo = "/coinbase-wallet-logo.png";

const MONO = "'IBM Plex Mono', monospace";
const SANS = "'Inter', -apple-system, sans-serif";

const STEPS = [
  {
    num: "01",
    title: "Connect Wallet",
    desc: "Connect an EVM wallet (MetaMask, Rabby, Coinbase Wallet, or WalletConnect) from the top-right menu. One wallet covers both Arbitrum and Hyperliquid.",
    logos: [
      { src: metamaskLogo, alt: "MetaMask" },
      { src: rabbyLogo, alt: "Rabby" },
      { src: coinbaseLogo, alt: "Coinbase Wallet" },
    ],
  },
  {
    num: "02",
    title: "Fund Account",
    desc: "Deposit USDC (Hyperliquid) or USDT (Arbitrum) from your EVM wallet into exchange sub-accounts via the Portfolio page.",
    logos: [
      { src: "/usdc-logo.webp", alt: "USDC" },
      { src: "/usdt-logo.png", alt: "USDT" },
    ],
  },
  {
    num: "03",
    title: "Trade Perpetuals",
    desc: "Pick a market, choose your chain — Arbitrum (Aster DEX) or Hyperliquid — set leverage, go Long or Short. Optional TP/SL across 450+ markets.",
    logos: [
      { src: "/btc-logo.png", alt: "BTC" },
      { src: "/bnb-logo.png", alt: "BNB" },
      { src: "/xrp-logo.png", alt: "XRP" },
    ],
  },
  {
    num: "04",
    title: "Swap Tokens",
    desc: "Swap any token on Arbitrum via 1inch with live quotes and best-route execution. Collateral is USDT on Arbitrum and USDC on Hyperliquid.",
    logos: [
      { src: "/tokens/arb.webp", alt: "Arbitrum" },
      { src: "/tokens/hyperliquid.webp", alt: "Hyperliquid" },
      { src: "/usdt-logo.png", alt: "USDT" },
    ],
  },
  {
    num: "05",
    title: "Manage Positions",
    desc: "Monitor PnL, adjust TP/SL, or close positions from the terminal or Portfolio page. All protocols, one unified view.",
    customGraphic: "pnl-chart",
  },
];

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}

export default function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [entering, setEntering] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (open) {
      setEntering(true);
      const t = setTimeout(() => setEntering(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      data-testid="help-modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        opacity: entering ? 0 : 1,
        transition: "opacity 0.2s ease-out",
      }}
    >
      <div
        data-testid="help-modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: "94vw", maxWidth: 480,
          maxHeight: "90vh",
          borderRadius: 20,
          background: "linear-gradient(170deg, rgba(18,22,28,0.98), rgba(11,15,20,0.98))",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.04)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          transform: entering ? "scale(0.96) translateY(10px)" : "scale(1) translateY(0)",
          transition: "transform 0.2s ease-out",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px",
        }}>
          <div>
            <div style={{
              fontSize: 16, fontWeight: 800, color: "#E6EDF3", fontFamily: SANS,
              letterSpacing: "-0.02em",
            }}>
              Quick Start
            </div>
            <div style={{
              fontSize: 11, color: "#4B5563", fontFamily: MONO,
              marginTop: 2, letterSpacing: "0.06em", textTransform: "uppercase" as const,
            }}>
              5 steps to trading
            </div>
          </div>
          <button
            data-testid="help-modal-close"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10, width: 34, height: 34,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#4B5563", fontSize: 15,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#9CA3AF"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#4B5563"; }}
          >
            &#x2715;
          </button>
        </div>

        <div style={{
          flex: 1, overflowY: "auto", padding: isMobile ? "4px 16px 16px" : "4px 24px 24px",
          scrollbarWidth: "none",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {STEPS.map((s, i) => (
              <div
                key={i}
                data-testid={`help-step-${i}`}
                style={{
                  padding: isMobile ? "14px 14px" : "16px 20px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
                  transition: "border-color 0.2s, background 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(212,165,116,0.2)";
                  e.currentTarget.style.background = "rgba(212,165,116,0.03)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: "#D4A574",
                    fontFamily: MONO, letterSpacing: "0.04em",
                    opacity: 0.7,
                  }}>
                    {s.num}
                  </span>
                  <span style={{
                    fontSize: 14, fontWeight: 700, color: "#E6EDF3",
                    fontFamily: SANS, letterSpacing: "-0.01em",
                  }}>
                    {s.title}
                  </span>
                  {"logos" in s && s.logos && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 2 }}>
                      {(s.logos as { src: string; alt: string }[]).map((logo, li) => (
                        <img key={li} src={logo.src} alt={logo.alt} width={18} height={18} style={{ objectFit: "contain", borderRadius: 4 }} />
                      ))}
                    </div>
                  )}
                  {"customGraphic" in s && s.customGraphic === "pnl-chart" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 4 }}>
                      <svg width="48" height="22" viewBox="0 0 48 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4" y="10" width="3" height="8" rx="1" fill="#33FF88" opacity="0.9" />
                        <rect x="10" y="6" width="3" height="12" rx="1" fill="#33FF88" opacity="0.9" />
                        <rect x="16" y="12" width="3" height="6" rx="1" fill="#D4A574" opacity="0.9" />
                        <rect x="22" y="4" width="3" height="14" rx="1" fill="#33FF88" opacity="0.9" />
                        <rect x="28" y="8" width="3" height="10" rx="1" fill="#33FF88" opacity="0.9" />
                        <rect x="34" y="14" width="3" height="4" rx="1" fill="#D4A574" opacity="0.9" />
                        <rect x="40" y="2" width="3" height="16" rx="1" fill="#33FF88" opacity="0.9" />
                        <path d="M5 16 L11 10 L17 14 L23 6 L29 10 L35 15 L41 4" stroke="#33FF88" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                      </svg>
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: 12, color: "#6B7280", fontFamily: SANS,
                  lineHeight: 1.6, paddingLeft: isMobile ? 0 : 23,
                  marginLeft: isMobile ? 0 : 12,
                }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: "14px 24px 20px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}>
          <button
            data-testid="help-close-btn"
            onClick={onClose}
            style={{
              width: "100%", padding: "12px 0", borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #D4A574, #D4541E)",
              color: "#fff",
              fontSize: 13, fontWeight: 700, fontFamily: SANS,
              cursor: "pointer",
              transition: "all 0.15s",
              boxShadow: "0 4px 16px rgba(212,165,116,0.25), 0 1px 2px rgba(0,0,0,0.3)",
              letterSpacing: "0.01em",
            }}
          >
            Start Trading
          </button>
        </div>
      </div>
    </div>
  );
}
