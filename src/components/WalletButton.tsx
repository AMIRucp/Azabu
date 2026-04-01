"use client";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { useEffect, useState, useMemo, useCallback } from "react";
import { WalletSelectModal } from "./WalletSelectModal";
import { ConnectWalletEmblem } from "./ConnectWalletEmblem";

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

const MONO = "'IBM Plex Mono', monospace";
const SANS = "'Inter', -apple-system, sans-serif";

const WalletIcon = ({ size = 16, color = "#D4A574" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="6" width="20" height="14" rx="3" stroke={color} strokeWidth="1.5" />
    <path d="M16 13a1 1 0 100-2 1 1 0 000 2z" fill={color} />
    <path d="M6 6V4a2 2 0 012-2h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function WalletButton() {
  const { isEvmConnected, evmAddress, disconnectEvm } = useEvmWallet();
  const [mounted, setMounted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = () => setShowModal(true);
    window.addEventListener("afx-open-wallet-modal", handler);
    return () => window.removeEventListener("afx-open-wallet-modal", handler);
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-wallet-menu]")) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const evmAddr = useMemo(() => {
    if (!evmAddress) return "";
    return truncateAddress(evmAddress);
  }, [evmAddress]);

  const handleDisconnectEvm = useCallback(async () => {
    try { await disconnectEvm(); } catch {}
    setShowMenu(false);
  }, [disconnectEvm]);

  if (!mounted) {
    return (
      <div
        className="animate-pulse"
        style={{ height: 36, width: 36, borderRadius: 10, background: "#0F1320" }}
      />
    );
  }

  if (isEvmConnected) {
    return (
      <div className="relative z-50" data-wallet-menu>
        <button
          onClick={() => setShowMenu(p => !p)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          data-testid="button-wallet-connected"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px",
            borderRadius: 10,
            background: hovered || showMenu ? "rgba(212,165,116,0.08)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${hovered || showMenu ? "rgba(212,165,116,0.4)" : "rgba(255,255,255,0.08)"}`,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <WalletIcon size={16} color={hovered || showMenu ? "#D4A574" : "#9BA4AE"} />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <img src="/tokens/arb.webp" alt="ARB" style={{ width: 12, height: 12, borderRadius: "50%" }} />
              <img src="/tokens/hyperliquid.webp" alt="HL" style={{ width: 12, height: 12, borderRadius: "50%", marginLeft: -3 }} />
            </div>
            <span style={{ fontSize: 10, fontFamily: MONO, fontWeight: 500, color: "#E6EDF3", letterSpacing: "0.02em" }}>
              {evmAddr}
            </span>
          </div>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ marginLeft: 2, opacity: 0.4, transform: showMenu ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
            <path d="M1 3L4 5.5L7 3" stroke="#9BA4AE" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {showMenu && (
          <div
            className="absolute right-0 mt-2"
            style={{
              background: "#0F1320",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              minWidth: 220,
              zIndex: 100,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ padding: "10px 14px 6px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: 10, fontFamily: SANS, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Connected Wallet
              </span>
            </div>

            <button
              onClick={handleDisconnectEvm}
              className="w-full text-left flex items-center transition-colors duration-150"
              style={{
                padding: "10px 14px",
                color: "#E6EDF3",
                fontSize: 12,
                fontFamily: SANS,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                gap: 10,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              data-testid="button-disconnect-evm"
            >
              <div style={{ display: "flex", alignItems: "center", width: 18, height: 18 }}>
                <img src="/tokens/arb.webp" alt="Arbitrum" style={{ width: 18, height: 18, borderRadius: "50%" }} />
                <img src="/tokens/hyperliquid.webp" alt="HL" style={{ width: 12, height: 12, borderRadius: "50%", marginLeft: -6, border: "1.5px solid #0F1320" }} />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>EVM Wallet</span>
                <span style={{ fontSize: 10, fontFamily: MONO, color: "#6B7280" }}>{evmAddr}</span>
              </div>
              <span style={{ fontSize: 10, color: "#EF4444", opacity: 0.7 }}>Disconnect</span>
            </button>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <button
                onClick={() => { setShowMenu(false); setShowModal(true); }}
                className="w-full text-left transition-colors duration-150 flex items-center"
                style={{
                  padding: "10px 14px",
                  color: "#D4A574",
                  fontSize: 12,
                  fontFamily: SANS,
                  fontWeight: 500,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  gap: 10,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,165,116,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                data-testid="button-manage-wallets"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="6" stroke="#D4A574" strokeWidth="1.2" />
                  <path d="M9 6.5v5M6.5 9h5" stroke="#D4A574" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                Manage wallet
              </button>
            </div>
          </div>
        )}

        <WalletSelectModal open={showModal} onClose={() => setShowModal(false)} />
      </div>
    );
  }

  return (
    <>
      <ConnectWalletEmblem
        variant="compact"
        onClick={() => setShowModal(true)}
      />
      <WalletSelectModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
