"use client";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { useEffect, useState, useMemo, useCallback, useRef, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { WalletSelectModal } from "./WalletSelectModal";
import { ConnectWalletEmblem } from "./ConnectWalletEmblem";

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

const MONO = "'IBM Plex Mono', monospace";
const SANS = "'Inter', -apple-system, sans-serif";

const MENU_PANEL_STYLE = {
  background: "#0F1320",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  minWidth: 220,
  overflow: "hidden" as const,
  boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
};

export function WalletButton({ navbar = false }: { navbar?: boolean }) {
  const { isEvmConnected, evmAddress, disconnectEvm } = useEvmWallet();
  const [mounted, setMounted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 16 });
  const pillRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = () => setShowModal(true);
    window.addEventListener("afx-open-wallet-modal", handler);
    return () => window.removeEventListener("afx-open-wallet-modal", handler);
  }, []);

  const updateMenuPos = useCallback(() => {
    const el = pillRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 8, right: Math.max(16, window.innerWidth - rect.right) });
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    updateMenuPos();
    const onPointerDown = (e: globalThis.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-wallet-menu]") && !target.closest("[data-wallet-menu-panel]")) {
        setShowMenu(false);
      }
    };
    window.addEventListener("resize", updateMenuPos);
    window.addEventListener("scroll", updateMenuPos, true);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("resize", updateMenuPos);
      window.removeEventListener("scroll", updateMenuPos, true);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [showMenu, updateMenuPos]);

  const evmAddr = useMemo(() => {
    if (!evmAddress) return "";
    return truncateAddress(evmAddress);
  }, [evmAddress]);

  const handleDisconnectEvm = useCallback(async (e?: ReactMouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (disconnecting) return;
    setDisconnecting(true);
    setShowMenu(false);
    try {
      await disconnectEvm();
    } catch {
      // wagmi may throw if already disconnected
    } finally {
      setDisconnecting(false);
    }
  }, [disconnectEvm, disconnecting]);

  if (!mounted) {
    return (
      <div
        className="animate-pulse"
        style={{
          height: navbar ? 40 : 49,
          width: navbar ? 140 : 175,
          borderRadius: 32,
          background: "rgba(255,255,255,0.03)",
        }}
      />
    );
  }

  const pillHeight = navbar ? 40 : 49;
  const pillPad = navbar ? "0 10px 0 12px" : "0 14px";
  const addrSize = 12;
  const chainSize = navbar ? 9 : 10;

  const menuPanel = showMenu && mounted ? (
    <div
      data-wallet-menu-panel
      style={{
        ...MENU_PANEL_STYLE,
        position: "fixed",
        top: menuPos.top,
        right: menuPos.right,
        zIndex: 1000001,
      }}
    >
      <div style={{ padding: "10px 14px 6px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span style={{ fontSize: 10, fontFamily: SANS, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Connected Wallet
        </span>
      </div>

      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleDisconnectEvm}
        disabled={disconnecting}
        className="w-full text-left flex items-center transition-colors duration-150"
        style={{
          padding: "10px 14px",
          color: "#E6EDF3",
          fontSize: 12,
          fontFamily: SANS,
          background: "transparent",
          border: "none",
          cursor: disconnecting ? "wait" : "pointer",
          gap: 10,
          opacity: disconnecting ? 0.6 : 1,
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
        <span style={{ fontSize: 10, color: "#EF4444", opacity: 0.9 }}>
          {disconnecting ? "..." : "Disconnect"}
        </span>
      </button>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
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
  ) : null;

  if (isEvmConnected) {
    return (
      <>
        <div style={{ flexShrink: 0 }} data-wallet-menu>
          <button
            ref={pillRef}
            type="button"
            onClick={() => setShowMenu((p) => !p)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-testid="button-wallet-connected"
            style={{
              display: "flex",
              alignItems: "center",
              gap: navbar ? 8 : 10,
              height: pillHeight,
              padding: pillPad,
              borderRadius: 32,
              background: hovered || showMenu ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${hovered || showMenu ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.1)"}`,
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxSizing: "border-box",
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#94FFBB", flexShrink: 0,
              boxShadow: "0 0 8px rgba(148,255,187,0.6)",
            }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, minWidth: 0 }}>
              <span style={{
                fontSize: addrSize, fontFamily: MONO, fontWeight: 500, color: "#FFFFFF",
                letterSpacing: "0.02em", lineHeight: 1.2,
              }}>
                {evmAddr}
              </span>
              <span style={{
                fontSize: chainSize, fontFamily: SANS, fontWeight: 400, color: "#888888",
                letterSpacing: "0.02em", lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}>
                EVM - ARBITRUM
              </span>
            </div>
          </button>
        </div>

        {mounted ? createPortal(menuPanel, document.body) : null}
        <WalletSelectModal open={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  if (navbar) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          data-testid="button-connect-wallet-navbar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 40,
            padding: "0 12px",
            borderRadius: 32,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#94FFBB",
              flexShrink: 0,
              opacity: 0.5,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
            <span style={{ fontSize: 12, fontFamily: SANS, fontWeight: 500, color: "#FFFFFF", lineHeight: 1.2, whiteSpace: "nowrap" }}>
              Connect
            </span>
            <span style={{ fontSize: 9, fontFamily: SANS, fontWeight: 400, color: "#888888", lineHeight: 1.2, whiteSpace: "nowrap" }}>
              EVM - ARBITRUM
            </span>
          </div>
        </button>
        <WalletSelectModal open={showModal} onClose={() => setShowModal(false)} />
      </>
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
