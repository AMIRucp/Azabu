"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const mono = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

interface CollateralDrawerProps {
  open: boolean;
  onClose: () => void;
  token: string;
  chainLabel: string;
  amount?: number;
  srcChain?: string;
}

export default function CollateralDrawer({ open, onClose, token, chainLabel, amount, srcChain }: CollateralDrawerProps) {
  const [visible, setVisible] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  const defaultDstToken = (token === "USDT" ? "USDT" : "USDC") as "USDC" | "USDT";
  const defaultArbDst: "arbitrum" | "hyperliquid" = "arbitrum";
  const defaultAmount = amount && amount > 0 ? amount.toFixed(2) : undefined;
  const effectiveSrcChain = srcChain;

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimIn(true));
      });
    } else {
      setAnimIn(false);
      const t = setTimeout(() => setVisible(false), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  return (
    <div
      data-testid="collateral-drawer-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: animIn ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0)",
        backdropFilter: animIn ? "blur(4px)" : "none",
        transition: "background 0.25s, backdrop-filter 0.25s",
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        data-testid="collateral-drawer-panel"
        style={{
          width: 440,
          maxWidth: "100vw",
          height: "100%",
          background: "#08080c",
          borderLeft: "1px solid #1a1a24",
          transform: animIn ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #1a1a24",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4ec", fontFamily: mono }}>
              Get {token}
            </div>
            <div style={{ fontSize: 9, color: "#7a7a90", fontFamily: mono, marginTop: 2 }}>
              {amount && amount > 0
                ? `Bridge ~$${amount.toFixed(2)} ${token} to ${chainLabel}`
                : `Swap or bridge to ${chainLabel}`}
            </div>
          </div>
          <button
            data-testid="collateral-drawer-close"
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid #1a1a24",
              borderRadius: 6,
              color: "#7a7a90",
              cursor: "pointer",
              padding: 6,
              lineHeight: 0,
              transition: "border-color 0.12s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#333"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#1a1a24"}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 20px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#7a7a90",
          fontSize: 13,
        }}>
          Bridge feature coming soon
        </div>
      </div>
    </div>
  );
}
